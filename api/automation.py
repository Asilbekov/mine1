"""
Automation Engine - Core logic ported from automate_checks.py
This runs on Vercel as a serverless Python function
"""

import json
import os
import base64
import time
import requests
from http.server import BaseHTTPRequestHandler
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL', '')

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def get_config():
    """Load configuration from database"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT key, value, type FROM "ProjectConfig"')
    rows = cur.fetchall()
    conn.close()
    
    config = {}
    for row in rows:
        key = row['key']
        value = row['value']
        type_ = row['type']
        
        if type_ == 'number':
            try:
                config[key] = float(value) if '.' in value else int(value)
            except:
                config[key] = value
        elif type_ == 'boolean':
            config[key] = value.lower() == 'true'
        else:
            config[key] = value
    
    return config

def get_api_keys(service='gemini'):
    """Get active API keys"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        'SELECT key FROM "ApiKey" WHERE service = %s AND "isActive" = true AND "isSuspended" = false',
        (service,)
    )
    rows = cur.fetchall()
    conn.close()
    return [row['key'] for row in rows]

def get_session_cookies():
    """Get session cookies from database"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT name, value FROM "SessionCookie" WHERE "isActive" = true')
    rows = cur.fetchall()
    conn.close()
    return {row['name']: row['value'] for row in rows}

def add_log(level, message, check_id=None, worker_id=None, details=None):
    """Add log entry to database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            '''INSERT INTO "AutomationLog" (id, timestamp, level, message, "checkId", "workerId", details)
               VALUES (gen_random_uuid(), NOW(), %s, %s, %s, %s, %s)''',
            (level, message, check_id, worker_id, json.dumps(details) if details else None)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Log error: {e}")

def get_pending_checks():
    """Get pending checks from database"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        '''SELECT id, "receiptId", "paymentId", "terminalId", tin, "paymentDate" 
           FROM "Check" WHERE status = 'pending' ORDER BY "createdAt" LIMIT 50'''
    )
    rows = cur.fetchall()
    conn.close()
    return rows

def update_check_status(check_id, status, error=None, result_data=None):
    """Update check status in database"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        '''UPDATE "Check" SET status = %s, error = %s, "resultData" = %s, "updatedAt" = NOW()
           WHERE id = %s''',
        (status, error, json.dumps(result_data) if result_data else None, check_id)
    )
    conn.commit()
    conn.close()

def fetch_captcha(session, config, cookies_dict):
    """Fetch CAPTCHA from soliq.uz"""
    base_url = config.get('BASE_URL', 'https://my3.soliq.uz')
    captcha_url = config.get('CAPTCHA_URL', '/api/cashregister-edit-api/home/get-captcha')
    
    headers = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
    
    # Add bearer token
    bearer = cookies_dict.get('bearer_token', '')
    if bearer:
        headers['Authorization'] = bearer if bearer.startswith('Bearer') else f'Bearer {bearer}'
    
    try:
        response = session.get(
            f"{base_url}{captcha_url}",
            headers=headers,
            cookies=cookies_dict,
            timeout=config.get('REQUEST_TIMEOUT', 30)
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return {
                    'captcha_id': data.get('data', {}).get('id'),
                    'image_base64': data.get('data', {}).get('image')
                }
        return None
    except Exception as e:
        add_log('ERROR', f'CAPTCHA fetch error: {str(e)}')
        return None

def solve_captcha_gemini(image_base64, api_keys, config):
    """Solve CAPTCHA using Gemini API"""
    if not api_keys:
        return None
    
    model = config.get('GEMINI_MODEL', 'gemini-2.0-flash')
    
    for api_key in api_keys:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Read the CAPTCHA text in this image. Return ONLY the characters/numbers you see, nothing else. No explanation."},
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": image_base64
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 50
                }
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '').strip()
                if text:
                    return text
            elif response.status_code == 429:
                # Rate limited, try next key
                continue
                
        except Exception as e:
            add_log('WARNING', f'Gemini error with key: {str(e)[:50]}')
            continue
    
    return None

def upload_file(session, config, cookies_dict, check_data):
    """Upload ZIP file to repository"""
    base_url = config.get('BASE_URL', 'https://my3.soliq.uz')
    upload_url = config.get('FILE_UPLOAD_URL', '/api/general-api/file/repository-set-file')
    
    # Get bearer token
    bearer = cookies_dict.get('bearer_token', '')
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    if bearer:
        headers['Authorization'] = bearer if bearer.startswith('Bearer') else f'Bearer {bearer}'
    
    # Try to get file from database
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        '''SELECT data, "originalName" FROM "UploadedFile" 
           WHERE type = 'zip' AND "isActive" = true LIMIT 1'''
    )
    file_row = cur.fetchone()
    conn.close()
    
    if not file_row or not file_row.get('data'):
        add_log('WARNING', 'No ZIP file found in database')
        return None
    
    file_base64 = base64.b64encode(bytes(file_row['data'])).decode('utf-8')
    file_name = file_row.get('originalName', 'archive.zip')
    
    payload = {
        "lang": "ru",
        "docType": "application/x-zip-compressed",
        "pinCode": config.get('DEFAULT_PIN_CODE', '123456'),
        "repositoryId": config.get('REPOSITORY_ID', ''),
        "docDate": datetime.now().strftime("%d.%m.%Y"),
        "interactiveId": config.get('INTERACTIVE_ID', 58),
        "tin": config.get('DEFAULT_TIN', ''),
        "docNum": "docNum",
        "fileName": file_name,
        "contentType": "application/x-zip-compressed",
        "file": file_base64
    }
    
    try:
        response = session.post(
            f"{base_url}{upload_url}",
            headers=headers,
            cookies=cookies_dict,
            json=payload,
            timeout=config.get('REQUEST_TIMEOUT', 120)
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return data.get('data', {}).get('id')
        
        add_log('WARNING', f'File upload failed: {response.status_code}')
        return None
        
    except Exception as e:
        add_log('ERROR', f'File upload error: {str(e)}')
        return None

def submit_check(session, config, cookies_dict, check_data, captcha_id, captcha_value, file_id):
    """Submit check edit to soliq.uz"""
    base_url = config.get('BASE_URL', 'https://my3.soliq.uz')
    submit_url = config.get('SUBMIT_URL', '/api/cashregister-edit-api/check-edit/set-payment')
    
    bearer = cookies_dict.get('bearer_token', '')
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    if bearer:
        headers['Authorization'] = bearer if bearer.startswith('Bearer') else f'Bearer {bearer}'
    
    payment_id = check_data.get('paymentId', '')
    tin = check_data.get('tin', config.get('DEFAULT_TIN', ''))
    terminal_id = check_data.get('terminalId', '')
    payment_date = check_data.get('paymentDate', datetime.now().strftime("%d.%m.%Y"))
    
    payload = {
        "paymentId": payment_id,
        "vatTotal": 0,
        "cashTotal": 0,
        "cardTotal": "0",
        "attachedFile": file_id or "",
        "captchaId": captcha_id,
        "captchaValue": captcha_value,
        "cardType": "",
        "nameStatus": True,
        "clientIp": "77.77.777.7",
        "paymentDetails": [{
            "id": f"{payment_id}-0",
            "paymentId": payment_id,
            "tin": tin,
            "pinfl": None,
            "name": f"{check_data.get('receiptId', '')}-check edit",
            "price": 0,
            "vat": "0",
            "amount": 0,
            "discount": 0,
            "other": 0,
            "barCode": None,
            "label": None,
            "productCode": "10701001018000000",
            "unitCode": None,
            "unitName": None,
            "vatPercent": "0",
            "commissionTin": config.get('DEFAULT_TIN', ''),
            "commissionPinfl": None,
            "packageCode": "1495029",
            "paymentDate": payment_date,
            "terminalId": None,
            "year": None,
            "month": None,
            "day": None,
            "terminalStateId": None,
            "isRefund": None,
            "existsCommission": None,
            "vaucher": 0,
            "isNotLabel": None
        }],
        "tin": tin,
        "terminalId": terminal_id,
        "paymentDate": payment_date
    }
    
    try:
        response = session.post(
            f"{base_url}{submit_url}",
            headers=headers,
            cookies=cookies_dict,
            json=payload,
            timeout=config.get('REQUEST_TIMEOUT', 120)
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'success': data.get('success', False),
                'code': data.get('code'),
                'message': data.get('message', ''),
                'data': data.get('data')
            }
        elif response.status_code == 401:
            return {'success': False, 'code': 401, 'message': 'Session expired'}
        else:
            return {'success': False, 'code': response.status_code, 'message': 'Request failed'}
            
    except Exception as e:
        return {'success': False, 'code': -1, 'message': str(e)}

def process_single_check(session, config, cookies_dict, api_keys, check):
    """Process a single check through the full pipeline"""
    check_id = check['id']
    receipt_id = check['receiptId']
    
    add_log('INFO', f'Processing check {receipt_id}', check_id=check_id)
    update_check_status(check_id, 'processing')
    
    # Step 1: Fetch CAPTCHA
    captcha_data = fetch_captcha(session, config, cookies_dict)
    if not captcha_data:
        update_check_status(check_id, 'failed', 'Failed to fetch CAPTCHA')
        add_log('ERROR', f'CAPTCHA fetch failed for {receipt_id}', check_id=check_id)
        return False
    
    # Step 2: Solve CAPTCHA
    captcha_value = solve_captcha_gemini(captcha_data['image_base64'], api_keys, config)
    if not captcha_value:
        update_check_status(check_id, 'captcha_error', 'Failed to solve CAPTCHA')
        add_log('ERROR', f'CAPTCHA solve failed for {receipt_id}', check_id=check_id)
        return False
    
    add_log('INFO', f'CAPTCHA solved: {captcha_value}', check_id=check_id)
    
    # Step 3: Upload file
    file_id = upload_file(session, config, cookies_dict, check)
    if file_id:
        add_log('INFO', f'File uploaded: {file_id}', check_id=check_id)
    
    # Step 4: Submit check
    result = submit_check(
        session, config, cookies_dict, check,
        captcha_data['captcha_id'], captcha_value, file_id
    )
    
    if result['success']:
        update_check_status(check_id, 'completed', result_data=result)
        add_log('INFO', f'Check {receipt_id} completed successfully', check_id=check_id)
        return True
    else:
        error_msg = f"Code {result['code']}: {result['message']}"
        
        # Handle specific errors
        if result['code'] == 9999:
            # Server error - can retry
            update_check_status(check_id, 'pending', error_msg)
            add_log('WARNING', f'Server error 9999, will retry: {receipt_id}', check_id=check_id)
        elif result['code'] == -1002:
            # CAPTCHA error - reset to pending
            update_check_status(check_id, 'pending', error_msg)
            add_log('WARNING', f'CAPTCHA error, will retry: {receipt_id}', check_id=check_id)
        elif result['code'] == 401:
            update_check_status(check_id, 'pending', error_msg)
            add_log('ERROR', 'Session expired - need to refresh cookies', check_id=check_id)
            return 'session_expired'
        else:
            update_check_status(check_id, 'failed', error_msg, result)
            add_log('ERROR', f'Check {receipt_id} failed: {error_msg}', check_id=check_id)
        
        return False

def run_automation_batch():
    """Run a batch of automation - called by the API"""
    add_log('INFO', 'Starting automation batch')
    
    # Load config
    config = get_config()
    if not config:
        add_log('ERROR', 'No configuration found in database')
        return {'success': False, 'error': 'No configuration found. Click "Initialize Defaults" first.'}
    
    # Load API keys
    api_keys = get_api_keys('gemini')
    if not api_keys:
        add_log('ERROR', 'No Gemini API keys configured')
        return {'success': False, 'error': 'No Gemini API keys configured'}
    
    # Load cookies
    cookies_dict = get_session_cookies()
    if not cookies_dict.get('bearer_token'):
        add_log('ERROR', 'No bearer token configured')
        return {'success': False, 'error': 'No bearer token configured in Session Cookies'}
    
    # Get pending checks
    pending_checks = get_pending_checks()
    if not pending_checks:
        add_log('INFO', 'No pending checks to process')
        return {'success': True, 'message': 'No pending checks', 'processed': 0}
    
    add_log('INFO', f'Found {len(pending_checks)} pending checks')
    
    # Create session
    session = requests.Session()
    
    # Process checks
    processed = 0
    successful = 0
    failed = 0
    session_expired = False
    
    for check in pending_checks:
        if session_expired:
            break
            
        result = process_single_check(session, config, cookies_dict, api_keys, check)
        processed += 1
        
        if result == 'session_expired':
            session_expired = True
            break
        elif result:
            successful += 1
        else:
            failed += 1
        
        # Delay between checks
        delay = config.get('REQUEST_DELAY', 0.1)
        time.sleep(delay)
    
    session.close()
    
    summary = {
        'success': True,
        'processed': processed,
        'successful': successful,
        'failed': failed,
        'session_expired': session_expired
    }
    
    add_log('INFO', f'Batch completed: {successful}/{processed} successful', details=summary)
    
    return summary


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST request to start automation"""
        try:
            result = run_automation_batch()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())
    
    def do_GET(self):
        """Handle GET request for status"""
        try:
            # Get current stats
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute('SELECT COUNT(*) as count FROM "Check" WHERE status = %s', ('pending',))
            pending = cur.fetchone()['count']
            
            cur.execute('SELECT COUNT(*) as count FROM "Check" WHERE status = %s', ('processing',))
            processing = cur.fetchone()['count']
            
            cur.execute('SELECT COUNT(*) as count FROM "Check" WHERE status = %s', ('completed',))
            completed = cur.fetchone()['count']
            
            cur.execute('SELECT COUNT(*) as count FROM "Check" WHERE status = %s', ('failed',))
            failed = cur.fetchone()['count']
            
            conn.close()
            
            result = {
                'success': True,
                'status': {
                    'pending': pending,
                    'processing': processing,
                    'completed': completed,
                    'failed': failed,
                    'total': pending + processing + completed + failed
                }
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
