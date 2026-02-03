"""
CAPTCHA OCR Solver Module
Handles CAPTCHA image preprocessing and text extraction
"""

import base64
import io
import re
from PIL import Image
import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)


class CaptchaSolver:
    """Handles CAPTCHA solving using OCR"""
    
    def __init__(self, engine='easyocr', config=None):
        """
        Initialize CAPTCHA solver
        
        Args:
            engine (str): OCR engine to use ('easyocr' or 'tesseract')
            config (dict): Configuration options
        """
        self.engine = engine.lower()
        self.config = config or {}
        self.reader = None
        
        if self.engine == 'easyocr':
            self._init_easyocr()
        elif self.engine == 'tesseract':
            self._init_tesseract()
        elif self.engine == 'paddle':
            self._init_paddle()
        else:
            raise ValueError(f"Unsupported OCR engine: {engine}")
    
    def _init_easyocr(self):
        """Initialize EasyOCR reader"""
        try:
            import easyocr
            langs = self.config.get('langs', ['en'])
            gpu = self.config.get('gpu', True)
            
            logger.info(f"Initializing EasyOCR with languages: {langs}, GPU: {gpu}")
            self.reader = easyocr.Reader(langs, gpu=gpu)
            logger.info("EasyOCR initialized successfully")
        except ImportError:
            logger.error("EasyOCR not installed. Install with: pip install easyocr")
            raise
        except Exception as e:
            logger.error(f"Error initializing EasyOCR: {e}")
            raise
    
    def _init_tesseract(self):
        """Initialize Tesseract OCR"""
        try:
            import pytesseract
            tesseract_cmd = self.config.get('cmd', 'tesseract')
            
            # Set tesseract executable path
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            
            # Test if tesseract is accessible
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract version: {version}")
            
            self.reader = pytesseract
            logger.info("Tesseract initialized successfully")
        except ImportError:
            logger.error("pytesseract not installed. Install with: pip install pytesseract")
            raise
        except Exception as e:
            logger.error(f"Error initializing Tesseract: {e}")
            raise

    def _init_paddle(self):
        """Initialize PaddleOCR"""
        try:
            from paddleocr import PaddleOCR
            # For digit-only CAPTCHAs, we use 'en' but will filter to digits only
            # use_angle_cls handles rotation
            use_angle_cls = self.config.get('use_textline_orientation', True)  # Updated parameter name
            lang = self.config.get('lang', 'en')
            
            logger.info(f"Initializing PaddleOCR for DIGIT recognition (lang={lang}, angle_cls={use_angle_cls})")
            self.reader = PaddleOCR(use_textline_orientation=use_angle_cls, lang=lang)
            logger.info("PaddleOCR initialized successfully")
        except ImportError:
            logger.error("paddleocr not installed. Install with: pip install paddlepaddle paddleocr opencv-python")
            raise
        except Exception as e:
            logger.error(f"Error initializing PaddleOCR: {e}")
            raise
    
    def decode_base64_image(self, base64_string):
        """
        Decode base64 image string to PIL Image
        
        Args:
            base64_string (str): Base64 encoded image
            
        Returns:
            PIL.Image: Decoded image
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data))
            
            logger.debug(f"Decoded image: size={image.size}, mode={image.mode}")
            return image
        except Exception as e:
            logger.error(f"Error decoding base64 image: {e}")
            raise
    
    def preprocess_image(self, image):
        """
        Preprocess CAPTCHA image for better OCR accuracy
        
        Args:
            image (PIL.Image): Input image
            
        Returns:
            numpy.ndarray: Preprocessed image
        """
        try:
            # Convert PIL Image to numpy array
            img_array = np.array(image)
            
            # Convert to grayscale if needed
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Use specific preprocessing for PaddleOCR (glitch removal)
            if self.engine == 'paddle':
                return self._preprocess_for_paddle(gray)
            
            # Default preprocessing for other engines
            # Apply thresholding (use THRESH_BINARY, not threshold_BINARY)
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Denoise
            denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
            
            # Resize for better OCR (scale up small images)
            height, width = denoised.shape
            if height < 50 or width < 150:
                scale = max(50 / height, 150 / width)
                new_width = int(width * scale)
                new_height = int(height * scale)
                denoised = cv2.resize(denoised, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            logger.debug(f"Preprocessed image shape: {denoised.shape}")
            return denoised
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            # Return original if preprocessing fails
            return np.array(image)

    def _preprocess_for_paddle(self, gray_img):
        """
        Specific preprocessing for glitchy images as requested
        
        Strategy:
        0. CRITICAL: Upscale 3x (makes digits readable, noise removable)
        1. Thresholding (Otsu + Binary Inv)
        2. Morphological Opening to remove thin vertical lines
        3. Dilation to bolden numbers
        4. Invert back to black text on white
        """
        try:
            logger.debug(f"Preprocessing for Paddle - input shape: {gray_img.shape}, dtype: {gray_img.dtype}")
            
            # CRITICAL STEP 0: UPSCALE 3x
            # This makes numbers ~50px tall (readable) and noise lines ~3px wide (removable)
            upscaled = cv2.resize(gray_img, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
            
            # Add padding (white border) to help with edge characters
            upscaled = cv2.copyMakeBorder(upscaled, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)
            
            logger.debug(f"After upscale (3x) and padding - shape: {upscaled.shape}")
            
            # 1. Thresholding: Convert to strict Black and White
            # We use Otsu's binarization to automatically find the best threshold
            _, binary = cv2.threshold(upscaled, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            logger.debug(f"After threshold - shape: {binary.shape}")
            
            # 2. Remove the "Glitch" lines (The Vertical Lines)
            # Now that image is 3x bigger, numbers are thick blobs and noise lines are thin strips
            # Use kernel size 3x3 for the upscaled image
            kernel = np.ones((3,3), np.uint8)
            
            # "Opening" = Erosion followed by Dilation. 
            # It removes small noise (lines) and keeps larger structures (numbers).
            clean_img = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
            logger.debug(f"After morphology - shape: {clean_img.shape}")
            
            # 3. Optional: Dilate slightly to make numbers more bold (skip for now)
            # clean_img = cv2.dilate(clean_img, kernel, iterations=1)
            
            # 4. Invert back to black text on white background (standard for OCR)
            clean_img = cv2.bitwise_not(clean_img)
            
            logger.debug(f"Preprocessing complete - output shape: {clean_img.shape}")
            return clean_img
        except Exception as e:
            import traceback
            logger.error(f"Error in Paddle preprocessing: {e}")
            logger.debug(f"Preprocessing traceback: {traceback.format_exc()}")
            # Return original grayscale image if preprocessing fails
            return gray_img
    
    def solve_with_easyocr(self, image):
        """
        Solve CAPTCHA using EasyOCR
        
        Args:
            image (numpy.ndarray): Preprocessed image
            
        Returns:
            str: Extracted text
        """
        try:
            # EasyOCR works with numpy arrays
            results = self.reader.readtext(image, detail=1)
            
            if not results:
                logger.warning("EasyOCR: No text detected")
                return ""
            
            # Concatenate all detected text in order (left to right)
            # Sort by x-coordinate of bounding box (first element is bbox)
            results_sorted = sorted(results, key=lambda x: x[0][0][0])
            texts = [text for (bbox, text, conf) in results_sorted]
            all_text = ''.join(texts)
            
            logger.debug(f"EasyOCR: Detected all texts: {texts}")
            logger.debug(f"EasyOCR: Combined text: '{all_text}'")
            return all_text
        except Exception as e:
            logger.error(f"Error in EasyOCR: {e}")
            return ""
    
    def solve_with_tesseract(self, image):
        """
        Solve CAPTCHA using Tesseract
        
        Args:
            image (numpy.ndarray): Preprocessed image
            
        Returns:
            str: Extracted text
        """
        try:
            config = self.config.get('config', '--psm 7 --oem 3')
            
            # Convert numpy array to PIL Image for pytesseract
            pil_image = Image.fromarray(image)
            
            # Extract text
            text = self.reader.image_to_string(pil_image, config=config)
            
            logger.debug(f"Tesseract: Detected '{text.strip()}'")
            return text.strip()
        except Exception as e:
            logger.error(f"Error in Tesseract: {e}")
            return ""

    def solve_with_paddle(self, image):
        """
        Solve CAPTCHA using PaddleOCR
        
        Args:
            image (numpy.ndarray): Preprocessed image
            
        Returns:
            str: Extracted text
        """
        try:
            # PaddleOCR requires 3-channel (RGB) images
            # If image is grayscale (2D), convert to RGB
            if len(image.shape) == 2:
                logger.debug(f"Converting grayscale to RGB - shape: {image.shape}")
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            elif len(image.shape) == 3 and image.shape[2] == 1:
                logger.debug(f"Converting single-channel to RGB - shape: {image.shape}")
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            
            logger.debug(f"About to call reader.ocr() with image shape: {image.shape}")
            logger.debug(f"Image dtype: {image.dtype}")
            
            # Call PaddleOCR - new API returns a list of dicts
            result = self.reader.ocr(image)
            
            logger.debug(f"reader.ocr() completed successfully")
            logger.debug(f"PaddleOCR raw result type: {type(result)}")
            
            # Parse results - NEW API FORMAT
            recognized_text = ""
            
            # Check if result is valid
            if not result or len(result) == 0:
                logger.debug("PaddleOCR returned None or empty result")
                return ""
            
            # New API returns list of dicts
            first_result = result[0]
            if isinstance(first_result, dict):
                # New API format: {'rec_texts': [...], 'rec_polys': [...], 'rec_scores': [...]}
                rec_texts = first_result.get('rec_texts', [])
                rec_polys = first_result.get('rec_polys', [])
                
                logger.debug(f"New API: Found {len(rec_texts)} text regions")
                
                if not rec_texts:
                    logger.debug("No text detected")
                    return ""
                
                # Sort by X-coordinate (left to right)
                # rec_polys is [[x1,y1], [x2,y2], [x3,y3], [x4,y4]] for each text
                text_with_positions = []
                for i, (text, poly) in enumerate(zip(rec_texts, rec_polys)):
                    # Get leftmost X coordinate
                    x_pos = poly[0][0] if len(poly) > 0 else 0
                    text_with_positions.append((x_pos, text))
                    logger.debug(f"  Region {i}: x={x_pos}, text='{text}'")
                
                # Sort by X position
                text_with_positions.sort(key=lambda x: x[0])
                
                # Combine sorted text
                for x_pos, text in text_with_positions:
                    recognized_text += str(text)
                
            else:
                # Old API format (fallback)
                logger.debug("Using old API format parsing")
                if first_result:
                    for line in first_result:
                        if line and len(line) >= 2:
                            text_info = line[1]
                            if isinstance(text_info, (tuple, list)) and len(text_info) >= 1:
                                text = text_info[0]
                                recognized_text += str(text)
            
            final_text = recognized_text.strip()
            logger.debug(f"PaddleOCR: Detected '{final_text}' (before digit filter)")
            return final_text
            
        except Exception as e:
            import traceback
            logger.error(f"Error in PaddleOCR: {e}")
            logger.debug(f"Full traceback: {traceback.format_exc()}")
            return ""
    
    def clean_captcha_text(self, text):
        """
        Clean and validate CAPTCHA text
        
        Args:
            text (str): Raw OCR output
            
        Returns:
            str: Cleaned text (digits only)
        """
        # Remove all non-digit characters
        cleaned = re.sub(r'[^0-9]', '', text)
        
        # Keep all digits (CAPTCHA length may vary)
        logger.debug(f"Cleaned CAPTCHA: '{text}' -> '{cleaned}' (length: {len(cleaned)})")
        
        if not cleaned:
            logger.warning(f"No digits found in OCR output: '{text}'")
        
        return cleaned
    
    def solve(self, base64_image, preprocess=True):
        """
        Solve CAPTCHA from base64 encoded image
        
        Args:
            base64_image (str): Base64 encoded CAPTCHA image
            preprocess (bool): Whether to preprocess the image
            
        Returns:
            str: Solved CAPTCHA text (digits only)
        """
        try:
            # Decode image
            image = self.decode_base64_image(base64_image)
            
            # Save CAPTCHA image for debugging
            try:
                import time
                debug_path = f"captcha_debug_{int(time.time())}.png"
                image.save(debug_path)
                logger.debug(f"Saved CAPTCHA image to {debug_path}")
            except Exception as e:
                logger.debug(f"Could not save CAPTCHA image: {e}")
            
            # Preprocess if enabled (with fallback if it fails)
            if preprocess:
                try:
                    processed_image = self.preprocess_image(image)
                except Exception as e:
                    logger.warning(f"Preprocessing failed ({e}), using raw image instead")
                    processed_image = np.array(image)
            else:
                processed_image = np.array(image)
            
            # Solve with selected OCR engine
            if self.engine == 'easyocr':
                raw_text = self.solve_with_easyocr(processed_image)
            elif self.engine == 'paddle':
                raw_text = self.solve_with_paddle(processed_image)
            else:  # tesseract
                raw_text = self.solve_with_tesseract(processed_image)
            
            # Clean and validate
            captcha_text = self.clean_captcha_text(raw_text)
            
            if captcha_text:
                logger.info(f"CAPTCHA solved: {captcha_text}")
            else:
                logger.warning("CAPTCHA solving failed: no text extracted")
            
            return captcha_text
        except Exception as e:
            logger.error(f"Error solving CAPTCHA: {e}")
            return ""
    
    def save_captcha_image(self, base64_image, filepath):
        """
        Save CAPTCHA image to file for debugging
        
        Args:
            base64_image (str): Base64 encoded image
            filepath (str): Output file path
        """
        try:
            image = self.decode_base64_image(base64_image)
            image.save(filepath)
            logger.debug(f"Saved CAPTCHA image to {filepath}")
        except Exception as e:
            logger.error(f"Error saving CAPTCHA image: {e}")


if __name__ == "__main__":
    # Test the solver
    logging.basicConfig(level=logging.DEBUG)
    
    # Example base64 CAPTCHA from HAR file (truncated for testing)
    test_captcha = "/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a..."
    
    # Test with EasyOCR
    # try:
    #     solver = CaptchaSolver(engine='easyocr', config={'langs': ['en'], 'gpu': False})
    #     result = solver.solve(test_captcha)
    #     print(f"EasyOCR Result: {result}")
    # except Exception as e:
    #     print(f"EasyOCR test failed: {e}")
    
    # Test with PaddleOCR
    try:
        print("Testing PaddleOCR...")
        solver = CaptchaSolver(engine='paddle')
        # Note: This will likely fail with the dummy base64 above, but verifies init
        # result = solver.solve(test_captcha)
        # print(f"PaddleOCR Result: {result}")
        print("PaddleOCR initialized successfully")
    except Exception as e:
        print(f"PaddleOCR test failed: {e}")
