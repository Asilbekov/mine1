#!/usr/bin/env python3
"""Extract count of successfully submitted checks from automation.log"""

import re
import sys

def extract_successful_checks(log_file):
    """
    Parse automation.log and extract success count from progress lines.
    Looks for "Success: X" pattern in progress update lines.
    """
    total_successful = 0
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                # Pattern: "Success: X, Failed: Y" from progress lines
                match = re.search(r'Success: (\d+), Failed: (\d+)', line)
                if match:
                    success = int(match.group(1))
                    total_successful = max(total_successful, success)
                
        return total_successful
    
    except FileNotFoundError:
        print(f"Error: Log file '{log_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading log file: {e}")
        sys.exit(1)

def main():
    log_file = "automation.log"
    
    count = extract_successful_checks(log_file)
    
    print(f"Total successfully submitted checks: {count}")

if __name__ == "__main__":
    main()
