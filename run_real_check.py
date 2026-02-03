"""Run a single real check using the project's automation (contacts real API).

Usage:
  python run_real_check.py [CHECK_NUMBER]

Notes:
- This will perform real network requests and use the configured OCR engine.
- Ensure `SESSION_COOKIES` and `bearer_token` in `config.py` are valid before running.
"""
import sys
import logging

logging.basicConfig(level=logging.INFO)

from automate_checks import CheckAutomation
import config


def main():
    # Test with a 10-digit check number that was failing
    check_number = sys.argv[1] if len(sys.argv) > 1 else '5464588689'

    automation = CheckAutomation()

    # Don't start background cookie refresher for a single-run submit
    automation.cookie_refresher.stop()

    # Dynamic padding logic (same as in automate_checks.py)
    check_number_part = check_number.zfill(16)
    payment_id = 'EP000000000551' + check_number_part

    check_data = {
        'check_number': check_number,
        'payment_id': payment_id,
        'row_index': 2,
        'payment_details': [],
        'tin': '304739262',
        'terminal_id': 'EP000000000551',
        'payment_date': '2025-10-12'
    }

    print(f"Running real process_check for check: {check_number}")

    try:
        success = automation.process_check(check_data)
        print(f"process_check returned: {success}")
    except Exception as e:
        print(f"Error during processing: {e}")


if __name__ == '__main__':
    main()
