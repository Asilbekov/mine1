"""
Auto-refresh cookies from existing Chrome browser session.

This script:
1. Connects to your existing Chrome browser (must be started with remote debugging)
2. Reloads the my3.soliq.uz page
3. Extracts fresh cookies and bearer token
4. Updates config.py automatically

Usage:
1. Start Chrome with remote debugging:
   chrome.exe --remote-debugging-port=9222

2. Navigate to my3.soliq.uz and login

3. Run this script:
   python refresh_cookies.py
"""

import json
import re
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Fix Windows console encoding for emoji support
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except:
        pass  # Ignore if reconfigure not available


def extract_bearer_from_requests(driver):
    """Extract Bearer token from network requests"""
    try:
        # Get performance logs (network activity)
        logs = driver.get_log('performance')
        
        for entry in logs:
            try:
                log = json.loads(entry['message'])['message']
                
                # Look for network requests
                if log.get('method') == 'Network.requestWillBeSent':
                    request = log.get('params', {}).get('request', {})
                    headers = request.get('headers', {})
                    
                    # Check for Authorization header
                    if 'Authorization' in headers:
                        auth = headers['Authorization']
                        if auth.startswith('Bearer '):
                            print(f"✓ Found Bearer token in request to: {request.get('url', 'unknown')}")
                            return auth
            except (json.JSONDecodeError, KeyError):
                continue
        
        return None
    except Exception as e:
        print(f"Error extracting bearer token: {e}")
        return None


def connect_to_chrome():
    """Connect to existing Chrome instance with remote debugging"""
    print("\n🔌 Connecting to Chrome (port 9222)...")
    
    chrome_options = Options()
    chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    
    # Enable performance logging to capture network requests
    chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        print("✓ Connected to Chrome successfully!")
        return driver
    except Exception as e:
        print(f"\n❌ Failed to connect to Chrome!")
        print(f"Error: {e}")
        print("\n📌 Make sure Chrome is running with remote debugging:")
        print("   chrome.exe --remote-debugging-port=9222")
        print("\n   Or on Windows, create a shortcut with target:")
        print('   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222')
        return None


def refresh_and_get_cookies(driver):
    """Reload page and extract fresh cookies"""
    print("Refreshing page...")
    
    current_url = driver.current_url
    print(f"Current URL: {current_url}")
    
    if 'my3.soliq.uz' not in current_url:
        print("\n⚠️  Warning: You're not on my3.soliq.uz")
        print("Navigate to my3.soliq.uz first, then run this script again.")
        return None, None
    
    # Reload the page
    driver.refresh()
    
    # Wait for page to load
    time.sleep(3)
    
    # Extract cookies
    print("\n🍪 Extracting cookies...")
    cookies = driver.get_cookies()
    
    cookie_dict = {}
    for cookie in cookies:
        cookie_dict[cookie['name']] = cookie['value']
        print(f"  • {cookie['name']}: {cookie['value'][:50]}...")
    
    # Extract Bearer token from network requests
    print("\n🔑 Looking for Bearer token in network requests...")
    print("   (Performing an API action to capture the token...)")
    
    # Trigger a small API request by interacting with the page
    bearer_token = extract_bearer_from_requests(driver)
    
    if not bearer_token:
        # Try alternative: get from localStorage or sessionStorage
        print("   Checking browser storage...")
        try:
            bearer_token = driver.execute_script("return localStorage.getItem('token') || sessionStorage.getItem('token');")
            if bearer_token and not bearer_token.startswith('Bearer '):
                bearer_token = f'Bearer {bearer_token}'
        except:
            pass
    
    if bearer_token:
        print(f"✓ Bearer token found: {bearer_token[:50]}...")
    else:
        print("  Bearer token not found - may need manual update")
    
    return cookie_dict, bearer_token


def update_config(cookies, bearer_token):
    """Update config.py with new credentials"""
    print("\n Updating config.py...")
    
    config_path = "config.py"
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Build new SESSION_COOKIES dictionary
        new_session_cookies = "SESSION_COOKIES = {\n"
        
        # Add each cookie
        if 'smart_top' in cookies:
            new_session_cookies += f"    'smart_top': '{cookies['smart_top']}',\n"
        if 'TICKET_SESSION_ID' in cookies:
            new_session_cookies += f"    'TICKET_SESSION_ID': '{cookies['TICKET_SESSION_ID']}',\n"
        if 'ADRUM_BTa' in cookies:
            new_session_cookies += f"    'ADRUM_BTa': '{cookies['ADRUM_BTa']}',\n"
        if 'ADRUM_BT1' in cookies:
            new_session_cookies += f"    'ADRUM_BT1': '{cookies['ADRUM_BT1']}',\n"
        
        # Add bearer token
        if bearer_token:
            new_session_cookies += f"    'bearer_token': '{bearer_token}'\n"
        else:
            # Keep existing or add placeholder
            new_session_cookies += f"    'bearer_token': 'UPDATE_MANUALLY'\n"
        
        new_session_cookies += "}"
        
        # Replace SESSION_COOKIES in config
        pattern = r'SESSION_COOKIES = \{[^}]+\}'
        updated_content = re.sub(pattern, new_session_cookies, content, flags=re.DOTALL)
        
        # Write back
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print("✓ config.py updated successfully!")
        
    except Exception as e:
        print(f" Error updating config.py: {e}")
        print("\n Manual values to copy:")
        print(f"\nSESSION_COOKIES = {json.dumps(cookies, indent=4)}")
        if bearer_token:
            print(f"\nBearer token: {bearer_token}")


def main():
    print("=" * 70)
    print(" Auto Cookie Refresher for my3.soliq.uz")
    print("=" * 70)
    
    # Connect to Chrome
    driver = connect_to_chrome()
    if not driver:
        return
    
    try:
        # Get cookies and bearer token
        cookies, bearer_token = refresh_and_get_cookies(driver)
        
        if cookies:
            # Update config
            update_config(cookies, bearer_token)
            
            print("\n" + "=" * 70)
            print(" SUCCESS! Cookies refreshed and config updated.")
            print("=" * 70)
            print("\nYou can now run your automation:")
            print("  python run_real_check.py")
            print("  python automate_checks.py --limit 10")
        else:
            print("\n Failed to extract cookies")
    
    except Exception as e:
        print(f"\n Error: {e}")
    
    finally:
        # Don't close the browser - user is still using it
        print("\n(Browser tab left open)")


if __name__ == "__main__":
    main()
