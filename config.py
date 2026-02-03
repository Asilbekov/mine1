# Configuration file for my3.soliq.uz check automation
# Version: 2.0.0 (Senior-Level Optimized)
# Last Updated: 2024-12-04

# Base URLs and endpoints
BASE_URL = "https://my3.soliq.uz"
API_BASE = BASE_URL + "/api/cashregister-edit-api"

# API Endpoints
CAPTCHA_URL = API_BASE + "/home/get-captcha"
SUBMIT_URL = API_BASE + "/check-edit/set-payment"
FILE_UPLOAD_URL = BASE_URL + "/api/general-api/file/repository-set-file"

# API Constants from working HAR file
REPOSITORY_ID = "d8069e78bf077b43a2bbf7db3a7b78e3"  # From successful request
DEFAULT_TIN = "62409036610049"  # Commission TIN
DEFAULT_PIN_CODE = "123456"  # PIN code for file upload
INTERACTIVE_ID = 58  # Interactive session ID

# ===========================
# Authentication
# ===========================
# Option 1: Use session cookies (recommended)
# Copy cookies from your browser after logging in
# IMPORTANT: Also include the bearer_token from Authorization header for file uploads
# Example: {
#   'sessionid': 'your-session-id',
#   'csrftoken': 'your-csrf-token',
#   'bearer_token': 'eyJhbGciOiJIUzI1NiJ9...' (from Authorization: Bearer XXX)
# }
SESSION_COOKIES = {
    'smart_top': '1',
    'TICKET_SESSION_ID': '5CEB44E46FD740E781DE500004620BD9',
    'ADRUM_BTa': 'R:26|g:855c33f0-65e0-4c7e-87a9-e4f8d86523a3|n:customer1_9c28b63e-99cb-4969-b91e-d0d7809dc215',
    'ADRUM_BT1': 'R:26|i:2902|e:4|t:1765275801137',
    'bearer_token': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJNeXNvbGlxLWF1dGhvcml6YXRpb24iLCJzdWIiOiJlNGU0MDFiYjlhYjVmZjg5MDE5YjAyOGVhMDcwNTcwZSIsImp0aSI6ImU0ZTQwMWJiOWFiNWZmODkwMTliMDI4ZWEwNzA1NzBlIiwiZXhwIjo0MTMyMDI5NjYwfQ.cpgI59iiKSi-Y-SIWI87s3bc1S7NaI1KDZqbUgJPMLU'
}

# Option 2: Login credentials (if login automation is needed)
# ===========================
# Request Configuration
# ===========================
REQUEST_TIMEOUT = 120  # seconds (increased for slow file uploads)
REQUEST_DELAY = 1 # seconds between requests (to avoid rate limiting)
MAX_RETRIES = 3  # Maximum retries for failed requests
UPLOAD_MAX_RETRIES = 3  # Maximum retries for file uploads
UPLOAD_RETRY_DELAY = 5  # Initial delay for upload retries
CAPTCHA_MAX_RETRIES = 2  # Maximum retries for CAPTCHA failures

# User-Agent
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"

# ===========================
# Excel / file paths
# ===========================
EXCEL_FILE = "Асилбекова Июнь тахрирлаш 20303 та.xlsx"
EXCEL_FILES = [
    "Асилбекова Июнь тахрирлаш 20303 та.xlsx",
    "Асилбекова Июль тахрирлаш 46430 та.xlsx",
    "Асилбекова_Август_тахрирлаш_48606_та.xlsx",
    "Асилбекова_Сентябрь_тахрирлаш_42930.xlsx",
    "Асилбекова_Октябрь_тахрирлаш_14626_та.xlsx",
]
ZIP_FILE = "АСИЛБЕКОВА.zip"
# PROGRESS_FILE is now dynamic - each Excel file gets its own progress
from pathlib import Path as _Path
_excel_basename = _Path(EXCEL_FILE).stem
PROGRESS_FILE = f"progress_{_excel_basename}.json"
PROGRESS_DB = f"progress_{_excel_basename}.db"  # SQLite database file
LOG_FILE = "automation.log"

# Column name or index for check number
CHECK_NUMBER_COLUMN = "receipt_id"  # Found in Excel analysis

# Column name for status/completion marking
STATUS_COLUMN = "status"  # Will be created if doesn't exist
COMPLETED_STATUS = "✓"  # Mark for completed checks

# ===========================
# Data Configuration
# ===========================
# Default values for the payload
DEFAULT_VAT_TOTAL = 0
DEFAULT_CASH_TOTAL = 0
DEFAULT_CARD_TOTAL = "0"
DEFAULT_CARD_TYPE = ""
DEFAULT_NAME_STATUS = True

# Client IP (can be dynamic or static)
CLIENT_IP = "127.0.0.1"

# ===========================
# Logging
# ===========================
LOG_LEVEL = "INFO"  # DEBUG, INFO, WARNING, ERROR
CONSOLE_OUTPUT = True

# ===========================
# Progress Tracking (SQLite-only, saves every batch automatically)
# ===========================
BATCH_SIZE = 50  # Process 50 checks per batch (larger = faster)

# ===========================
# Retry Configuration
# ===========================
MAX_RETRIES = 3  # Number of retry attempts for failed submissions
REQUEST_DELAY = 0.05  # Minimal delay between retries (50ms)
DELAY_BETWEEN_CHECKS = 0.05  # Minimal delay between checks (50ms)

# ===========================
# OCR / CAPTCHA defaults
# ===========================
OCR_ENGINE = 'gemini'  # 'paddle', 'tesseract', 'easyocr', 'gemini'
GEMINI_API_KEY = "AIzaSyBaUmjiYmm3KGj_T8__ECnebI7dj6JuA8s"  # Default to Key #1

# Active keys for current run
GEMINI_API_KEYS = [
    "AIzaSyBaUmjiYmm3KGj_T8__ECnebI7dj6JuA8s",  # Key #1
    "AIzaSyAY3Zs8ntokqZSuRHcfr7ZR4_bzD0FRCOs",  # Key #2
]

# Keep track of suspended keys to avoid reusing them
SUSPENDED_KEYS = [
    "AIzaSyA8jloi7aW_PTe9mSkiJ_2iLerIB6zcs8g",  # Old Key #3
    "AIzaSyB8W_uVdIwlH-PfCXPj5Kf72qtSmNBDjwA",  # Old Key #4
    "AIzaSyDCsackDnm4-xV9_Q_TueDQf-5-D_POiSE",  # Old Key #5
    "AIzaSyDxz-wFUIr5wTW44KLnn0rcgoenTDGJqZI",  # Old Key #7
    "AIzaSyCLGo5MWju_AsXKisLxNdABxvlHlrgIeTA",  # Old Key #8
    # Newly suspended (2024-12-04):
    "AIzaSyAA_itbg2vCpl8ySp3BvlH5PQt_M4iZjWc",  # Key #4 - SUSPENDED
    "AIzaSyBRAzInfe8ITroFlbwegSlucoueOnuKdBY",  # Key #5 - SUSPENDED
    "AIzaSyC8KivZmBjiXqGl3IsNqC-5_lqLpUsgCoM",  # Key #6 - SUSPENDED
    "AIzaSyClTwSWw6hIvMPsBmhENa60q55sExtk2ho",  # Key #9 - SUSPENDED
]
GEMINI_MODEL = "gemini-2.5-flash-lite"

# ===========================
# Gemini Rate Limiting (CRITICAL for preventing suspension)
# ===========================
# Free Tier limits: 15 RPM (requests per minute) per key
# 9 API keys = each worker has DEDICATED key = can go faster
GEMINI_RPM_PER_KEY = 14  # 93% of limit (safe with dedicated keys)
GEMINI_DELAY_BETWEEN_REQUESTS = 3.0  # 3s between calls (faster with dedicated keys)
GEMINI_BATCH_COOLDOWN = 0.5  # Minimal cooldown (dedicated keys = safe)
GEMINI_RATE_LIMIT_BACKOFF = 15.0  # Reduced backoff
GEMINI_MAX_IMAGES_PER_BATCH = 20  # Larger batches = fewer API calls = faster

EASYOCR_LANGS = ['en']
EASYOCR_GPU = False
TESSERACT_CMD = 'tesseract'
TESSERACT_CONFIG = '--psm 7 --oem 3'

# CAPTCHA preprocessing flag (used by OCR solver)
# Set to True for PaddleOCR to use the specific glitch removal logic
CAPTCHA_PREPROCESS = True  # Try with preprocessing

# ===========================
# Headers Template
# ===========================
HEADERS = {
    "accept": "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "ru,en-US;q=0.9,en;q=0.8,uz;q=0.7",
    "content-type": "application/json",
    "origin": BASE_URL,
    "referer": BASE_URL + "/remotes-services/online-and-virtual-cashbox/checks-komissioner",
    "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": USER_AGENT,
    "x-requested-with": "XMLHttpRequest",
    "connection": "keep-alive",
    "priority": "u=1, i"
}

# ===========================
# Performance Configuration (Balanced for stability)
# ===========================
import os
CPU_CORES = os.cpu_count() or 12

# Reduced parallelism to prevent server overload (was 25, now 10)
MAX_WORKERS_FILE_UPLOAD = 20  # Parallel uploads per worker
MAX_WORKERS_CHECK_SUBMIT = 20  # Parallel submissions per worker

# HTTP Connection Pool
CONNECTION_POOL_SIZE = 20  # Reduced connection pool
CONNECTION_POOL_MAXSIZE = 20  # Max per host
CONNECTION_POOL_BLOCK = False  # Don't block

# ===========================
# Server Error 9999 Retry Configuration (Exponential Backoff)
# ===========================
SERVER_ERROR_MAX_RETRIES = 5  # Max retries for 9999 errors
SERVER_ERROR_BASE_DELAY = 2.0  # Base delay in seconds (doubles each retry)
SERVER_ERROR_MAX_DELAY = 30.0  # Maximum delay cap in seconds

# ===========================
# Staggered Submission Delays (prevents server overload)
# ===========================
SUBMISSION_STAGGER_DELAY = 0.15  # 150ms between submissions
FILE_UPLOAD_STAGGER_DELAY = 0.2  # 200ms between file uploads
