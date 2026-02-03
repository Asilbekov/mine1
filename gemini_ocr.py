"""
Gemini OCR Solver using Google GenAI API (via requests)
Supports batch processing of CAPTCHA images with PROACTIVE RATE LIMITING.
"""
import requests
import json
import base64
import logging
import time
import threading
from collections import deque
import config

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Token bucket rate limiter to prevent API abuse.
    Tracks requests per key and enforces delays.
    Includes statistics for monitoring.
    """
    def __init__(self, rpm_per_key=12):
        self.rpm_per_key = rpm_per_key
        self.min_interval = 60.0 / rpm_per_key  # Minimum seconds between requests
        self._request_times = {}  # key -> deque of timestamps
        self._lock = threading.Lock()
        # Statistics
        self._stats = {
            'total_requests': 0,
            'rate_limit_waits': 0,
            'total_wait_time': 0.0,
            'requests_per_key': {}
        }
        
    def wait_if_needed(self, api_key):
        """
        Wait if we're approaching the rate limit for this key.
        Returns the wait time in seconds.
        """
        with self._lock:
            now = time.time()
            
            if api_key not in self._request_times:
                self._request_times[api_key] = deque(maxlen=self.rpm_per_key)
            
            times = self._request_times[api_key]
            
            # Clean old entries (older than 60 seconds)
            while times and now - times[0] > 60:
                times.popleft()
            
            # If we've made rpm_per_key requests in the last 60s, wait
            if len(times) >= self.rpm_per_key:
                oldest = times[0]
                wait_time = 60.0 - (now - oldest) + 0.5  # Add 0.5s buffer
                if wait_time > 0:
                    self._stats['rate_limit_waits'] += 1
                    self._stats['total_wait_time'] += wait_time
                    logger.warning(f"[RateLimiter] Key ...{api_key[-6:]}: Limit reached. Waiting {wait_time:.1f}s")
                    return wait_time
            
            # Also enforce minimum interval since last request
            if times:
                time_since_last = now - times[-1]
                if time_since_last < self.min_interval:
                    wait_time = self.min_interval - time_since_last
                    return wait_time
                    
            return 0
    
    def record_request(self, api_key):
        """Record that a request was made with this key."""
        with self._lock:
            now = time.time()
            if api_key not in self._request_times:
                self._request_times[api_key] = deque(maxlen=self.rpm_per_key)
            self._request_times[api_key].append(now)
            # Update stats
            self._stats['total_requests'] += 1
            key_short = f"...{api_key[-6:]}"
            self._stats['requests_per_key'][key_short] = self._stats['requests_per_key'].get(key_short, 0) + 1
    
    def get_stats(self):
        """Get current statistics."""
        with self._lock:
            return dict(self._stats)


class GeminiSolver:
    """
    Gemini OCR Solver with PROACTIVE rate limiting to prevent suspension.
    """
    # Class-level rate limiter shared across all instances
    _rate_limiter = None
    _suspended_keys = set()
    _lock = threading.Lock()
    
    def __init__(self):
        self.model = config.GEMINI_MODEL
        self._initialize_key()
        
        # Initialize rate limiter if not exists
        with self._lock:
            if GeminiSolver._rate_limiter is None:
                rpm = getattr(config, 'GEMINI_RPM_PER_KEY', 12)
                GeminiSolver._rate_limiter = RateLimiter(rpm_per_key=rpm)
                logger.info(f"[GeminiSolver] Rate limiter initialized: {rpm} RPM per key")
        
        # Use persistent session for connection reuse
        self.session = requests.Session()
        
        # Get config values with defaults
        self.delay_between_requests = getattr(config, 'GEMINI_DELAY_BETWEEN_REQUESTS', 4.0)
        self.batch_cooldown = getattr(config, 'GEMINI_BATCH_COOLDOWN', 2.0)
        self.rate_limit_backoff = getattr(config, 'GEMINI_RATE_LIMIT_BACKOFF', 30.0)
        self.max_images_per_batch = getattr(config, 'GEMINI_MAX_IMAGES_PER_BATCH', 10)
        
    def _initialize_key(self):
        """Initialize or rotate to a valid API key."""
        available_keys = [k for k in config.GEMINI_API_KEYS if k not in self._suspended_keys]
        
        if not available_keys:
            logger.error("ALL GEMINI API KEYS ARE SUSPENDED OR EXHAUSTED!")
            self.api_key = None
            return

        if config.GEMINI_API_KEY and config.GEMINI_API_KEY not in self._suspended_keys:
            self.api_key = config.GEMINI_API_KEY
        else:
            self.api_key = available_keys[0]
            
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        logger.info(f"GeminiSolver using Key: ...{self.api_key[-6:] if self.api_key else 'None'}")

    def _rotate_key(self, is_suspended=False):
        """Rotate to the next available API key."""
        if self.api_key and is_suspended:
            logger.warning(f"Marking key ...{self.api_key[-6:]} as SUSPENDED/INVALID")
            self._suspended_keys.add(self.api_key)
        
        available_keys = [k for k in config.GEMINI_API_KEYS if k not in self._suspended_keys]
        
        if not available_keys:
            logger.error("NO WORKING API KEYS LEFT! Cannot rotate.")
            return False
            
        import random
        self.api_key = random.choice(available_keys)
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        logger.info(f"Rotated to Key: ...{self.api_key[-6:]}")
        return True

    def _apply_rate_limit(self):
        """Apply rate limiting before making a request."""
        if not self.api_key:
            return
            
        # Check rate limiter
        wait_time = self._rate_limiter.wait_if_needed(self.api_key)
        if wait_time > 0:
            time.sleep(wait_time)
        
        # Always add minimum delay between requests
        time.sleep(self.delay_between_requests)
        
    def solve_batch(self, images_base64):
        """
        Solve a batch of CAPTCHA images with proactive rate limiting.
        Automatically splits large batches to stay under limits.
        """
        if not images_base64:
            return []
            
        if not self.api_key:
            self._initialize_key()
            if not self.api_key:
                return [""] * len(images_base64)

        # Split into smaller batches if needed
        if len(images_base64) > self.max_images_per_batch:
            logger.info(f"Splitting {len(images_base64)} images into batches of {self.max_images_per_batch}")
            results = []
            for i in range(0, len(images_base64), self.max_images_per_batch):
                chunk = images_base64[i:i + self.max_images_per_batch]
                chunk_results = self._solve_single_batch(chunk)
                results.extend(chunk_results)
                
                # Cooldown between mini-batches
                if i + self.max_images_per_batch < len(images_base64):
                    logger.debug(f"Batch cooldown: waiting {self.batch_cooldown}s...")
                    time.sleep(self.batch_cooldown)
                    
            return results
        else:
            return self._solve_single_batch(images_base64)
    
    def _solve_single_batch(self, images_base64):
        """Process a single batch with rate limiting."""
        
        # Apply rate limiting BEFORE the request
        self._apply_rate_limit()
        
        logger.info(f"Sending {len(images_base64)} images to Gemini (Key: ...{self.api_key[-6:]})...")

        parts = [
            {"text": """You are an expert OCR system specialized in reading 6-digit numeric CAPTCHAs. Your task is to extract EXACTLY 6 digits from each image with maximum precision.
STEP-BY-STEP ANALYSIS PROCESS:
1. Scan the image from left to right
2. Identify 6 distinct digit shapes (ignore all background noise, lines, dots, patterns)
3. For each digit position, determine the most likely number 0-9
4. Double-check your result has exactly 6 digits
NOISE PATTERNS IN THESE IMAGES:
- Multiple DIAGONAL CROSSING LINES go through the entire image
- These lines are THIN, STRAIGHT, and cross over the digits
- IGNORE these diagonal lines completely - they are NOT part of the digits
- The ACTUAL DIGITS are THICKER and have CURVED or ANGLED shapes
- Focus on the BOLD/THICK strokes that form recognizable digit shapes
HOW TO DISTINGUISH DIGITS FROM NOISE:
- Noise lines: Thin, straight, diagonal, crossing through multiple areas
- Digit strokes: Thicker, curved or angled, forming closed or semi-closed shapes
- If you see a thin diagonal line crossing through a digit, ignore that line
- Focus on the thicker, bolder lines that form the actual number shape
IGNORE completely:
- Diagonal crossing lines (noise pattern)
- Background noise, random dots
- Color variations, patterns, textures
- Thin straight lines that cross through the image
- Any non-numeric symbols
OUTPUT FORMAT:
Return a JSON array of strings. Each string = exactly 6 digits.
Example: ["123456", "789012", "345678"]
If unsure about a digit, make your best guess based on the THICKER strokes.
Every result MUST have exactly 6 characters (all digits 0-9)."""}
        ]
        
        for img_b64 in images_base64:
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": img_b64
                }
            })
            
        payload = {
            "contents": [{
                "parts": parts
            }],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.15,
                "topP": 0.95,
                "topK": 40
            }
        }
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Record the request
                self._rate_limiter.record_request(self.api_key)
                
                response = self.session.post(
                    self.api_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=60
                )
                
                if response.status_code == 200:
                    try:
                        result = response.json()
                        text_content = result['candidates'][0]['content']['parts'][0]['text']
                        solved_list = json.loads(text_content)
                        
                        if isinstance(solved_list, list):
                            if len(solved_list) != len(images_base64):
                                logger.warning(f"Gemini returned {len(solved_list)} results for {len(images_base64)} images. Padding/Truncating.")
                                if len(solved_list) < len(images_base64):
                                    solved_list.extend([""] * (len(images_base64) - len(solved_list)))
                                else:
                                    solved_list = solved_list[:len(images_base64)]
                            
                            logger.info(f"Gemini batch success: {solved_list}")
                            return solved_list
                        else:
                            logger.error(f"Gemini returned non-list JSON: {text_content}")
                            return [""] * len(images_base64)
                            
                    except Exception as e:
                        logger.error(f"Failed to parse Gemini response: {e}")
                        return [""] * len(images_base64)

                # Handle Errors
                logger.error(f"Gemini API Error {response.status_code}: {response.text[:200]}")
                
                is_suspended = False
                if response.status_code == 403:
                    error_msg = response.text.lower()
                    if "suspended" in error_msg or "permission denied" in error_msg:
                        is_suspended = True
                        logger.critical(f"KEY SUSPENDED: ...{self.api_key[-6:]}")
                
                if response.status_code == 429:
                    # Rate limited - apply backoff
                    logger.warning(f"Rate limit hit! Backing off for {self.rate_limit_backoff}s...")
                    time.sleep(self.rate_limit_backoff)
                    
                    # Try rotating key
                    if self._rotate_key(is_suspended=False):
                        continue
                    else:
                        break
                        
                if response.status_code in [403, 500, 503]:
                    if self._rotate_key(is_suspended=is_suspended):
                        time.sleep(2)  # Short delay before retry
                        continue
                    else:
                        break
                
                break
                
            except Exception as e:
                logger.error(f"Gemini request failed: {e}")
                if self._rotate_key():
                    time.sleep(2)
                    continue
                break
                
        return [""] * len(images_base64)

    def solve(self, image_base64, preprocess=False):
        """Single image solve (wraps batch)."""
        results = self.solve_batch([image_base64])
        return results[0] if results else ""

