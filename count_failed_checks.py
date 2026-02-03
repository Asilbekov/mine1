import json
import re
from pathlib import Path
import sys

def main():
    # 1. Load excluded checks from failed_checks.json
    failed_checks_file = Path("failed_checks.json")
    excluded_checks = set()
    
    if failed_checks_file.exists():
        try:
            with open(failed_checks_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Handle both structure formats if necessary, but based on view_file:
                # "failed_checks": [ { "check_number": "..." }, ... ]
                if "failed_checks" in data:
                    for item in data["failed_checks"]:
                        if "check_number" in item:
                            excluded_checks.add(str(item["check_number"]))
                
                # Also checks "permanently_failed" checks might be listed? 
                # The file structure showed "failed_checks" array.
                print(f"Loaded {len(excluded_checks)} checks from failed_checks.json to exclude")
        except Exception as e:
            print(f"Error loading failed_checks.json: {e}")
            return
    else:
        print("failed_checks.json not found")
        # Proceed with empty set? The user explicitly asked to exclude checks from this file.
        # If it's missing, maybe we should error or assume 0?
        # But user provided it in context, so it should be there.
    
    # 2. Parse automation.log for failures
    log_file = Path("automation.log")
    if not log_file.exists():
        print("automation.log not found")
        return

    found_failures = set()
    
    # Patterns to look for
    # Pattern 1: Final failure in batch loop
    # logger.error(f"Check {failed_check['check_number']} failed CAPTCHA after {failed_check['retry_count']} attempts")
    pattern_captcha_fail = re.compile(r"Check (\d+) failed CAPTCHA after \d+ attempts")
    
    # Pattern 2: Server error 9999 (though this might lead to Pattern 1 eventual failure, catching it just in case)
    # logger.error(f"❌ Server error 9999 persisted after .*? retries for check (\d+)")
    pattern_9999_fail = re.compile(r"Server error 9999 persisted after .*? retries for check (\d+)")
    
    # Pattern 3: Sequential mode failure
    # logger.error(f"[X] Failed to process check {check_number} after {config.MAX_RETRIES} attempts")
    pattern_seq_fail = re.compile(r"\[X\] Failed to process check (\d+) after \d+ attempts")

    print("Scanning automation.log (this might take a moment)...")
    
    try:
        with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                # Check Pattern 1
                m1 = pattern_captcha_fail.search(line)
                if m1:
                    found_failures.add(m1.group(1))
                    continue
                
                # Check Pattern 2
                m2 = pattern_9999_fail.search(line)
                if m2:
                    found_failures.add(m2.group(1))
                    continue
                    
                # Check Pattern 3
                m3 = pattern_seq_fail.search(line)
                if m3:
                    found_failures.add(m3.group(1))
                    continue

    except Exception as e:
        print(f"Error reading log file: {e}")
        return

    print(f"Total unique failures found in log: {len(found_failures)}")
    
    # 3. Compute difference
    new_failures = found_failures - excluded_checks
    
    print("-" * 40)
    print(f"Detailed Analysis:")
    print(f"Checks in failed_checks.json (Excluded): {len(excluded_checks)}")
    print(f"Checks found in automation.log: {len(found_failures)}")
    print(f"New failures (Found - Excluded): {len(new_failures)}")
    print("-" * 40)
    
    if new_failures:
        print("Run the following python list to get the new failed checks:")
        print(list(new_failures))
        
        # Optionally save to file
        output_file = "new_failed_checks.json"
        with open(output_file, "w") as f:
            json.dump(list(new_failures), f, indent=2)
        print(f"Saved new failures to {output_file}")
    else:
        print("No new failed checks found beyond what is in failed_checks.json")

if __name__ == "__main__":
    main()
