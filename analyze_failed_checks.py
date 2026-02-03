import json
import re
from pathlib import Path
import sys

def load_json_list(filepath):
    """Load check numbers from a JSON file (handling both list of strings and dicts)."""
    checks = set()
    path = Path(filepath)
    if not path.exists():
        print(f"Warning: {filepath} not found.")
        return checks
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if isinstance(data, list):
            # new_failed_checks.json format: ["123", "456"]
            for item in data:
                checks.add(str(item))
        elif isinstance(data, dict):
            # failed_checks.json format: {"failed_checks": [{"check_number": "123"}, ...]}
            if "failed_checks" in data:
                for item in data["failed_checks"]:
                    if "check_number" in item:
                        checks.add(str(item["check_number"]))
            # Also checking if there are other keys like "permanently_failed" containing lists?
            # Based on file view, "failed_checks" is the main list.
            
        print(f"Loaded {len(checks)} excluded checks from {filepath}")
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        
    return checks

def main():
    print("Starting analysis of failed vs successful checks...")
    
    # 1. Load Exclusions
    excluded_checks = set()
    excluded_checks.update(load_json_list("failed_checks.json"))
    excluded_checks.update(load_json_list("new_failed_checks.json"))
    
    print(f"Total excluded checks: {len(excluded_checks)}")
    
    # 2. Scan Log
    log_file = Path("automation.log")
    if not log_file.exists():
        print("Error: automation.log not found.")
        return

    success_checks = set()
    failed_checks = set()
    
    # Success Pattern: [OK] Check 123 submitted successfully OR [OK] Check 123 already submitted
    ptrn_success = re.compile(r"\[OK\] Check (\d+) (?:submitted successfully|already submitted)")
    
    # Failure Patterns combined
    # 1. Check 123 failed CAPTCHA
    # 2. Failed to submit check 123
    # 3. Batch item failed: 123
    # 4. Server error 9999 ... check 123
    # 5. Connection error for check 123
    ptrn_failure = re.compile(r"(?:Check (\d+) failed CAPTCHA|Failed to submit check (\d+)|Batch item failed: (\d+)|Server error 9999.*?check (\d+)|Connection error for check (\d+))")
    
    print("Scanning automation.log (this may take a while)...")
    
    line_count = 0
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line_count += 1
            if line_count % 100000 == 0:
                print(f"Processed {line_count} lines...", end='\r')
            
            # Check Success
            m_success = ptrn_success.search(line)
            if m_success:
                success_checks.add(m_success.group(1))
                continue
            
            # Check Failure
            m_fail = ptrn_failure.search(line)
            if m_fail:
                # Extract the first non-None group
                for g in m_fail.groups():
                    if g:
                        failed_checks.add(g)
                        break
    
    print(f"\nScanning complete. Processed {line_count} lines.")
    print(f"Total unique successes found: {len(success_checks)}")
    print(f"Total unique failures found: {len(failed_checks)}")
    
    # 3. Compute "Never Succeeded"
    # Logic: Failed at least once, but NEVER succeeded.
    never_succeeded = failed_checks - success_checks
    print(f"Checks that failed and NEVER succeeded: {len(never_succeeded)}")
    
    # 4. Apply Exclusions
    final_list_set = never_succeeded - excluded_checks
    final_list = sorted(list(final_list_set))
    
    print(f"After excluding {len(excluded_checks)} known failed checks...")
    print(f"Final Count: {len(final_list)}")
    
    # 5. Save Output
    output_file = "never_succeeded_checks.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, indent=2)
        
    print(f"Saved results to {output_file}")

if __name__ == "__main__":
    main()
