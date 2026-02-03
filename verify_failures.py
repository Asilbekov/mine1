import json
import re
from pathlib import Path
import sqlite3
import sys

def get_all_successful_checks():
    successful_checks = set()

    # 1. Scan automation.log for success messages
    # Patterns:
    # [OK] Check {number} submitted successfully
    # [OK] Check {number} already submitted
    # File uploaded successfully: {id} (doesn't mean check is done)
    # ✓ {number} (commented out in code but check just in case)
    
    log_file = Path("automation.log")
    if log_file.exists():
        print("Scanning automation.log for successes...")
        # Regex for success
        # [OK] Check 5484803975 submitted successfully
        # [OK] Check 5484803975 already submitted (Duplicate 9099) - Marking as done
        pattern_success = re.compile(r"\[OK\] Check (\d+) (?:submitted successfully|already submitted)")
        
        try:
            with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    m = pattern_success.search(line)
                    if m:
                        successful_checks.add(m.group(1))
        except Exception as e:
            print(f"Error reading log: {e}")

    # 2. Scan all progress files (JSON and DB)
    print("Scanning progress files...")
    
    # JSON files
    for p_file in Path(".").glob("progress*.json"):
        # filter out backup files or failed_checks.json
        if "backup" in p_file.name or "failed" in p_file.name:
            continue
            
        try:
            with open(p_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, str) and item.isdigit():
                            successful_checks.add(item)
                elif isinstance(data, dict):
                     # Handle dictionary if necessary (some older formats)
                     pass
        except Exception as e:
            print(f"Error reading {p_file}: {e}")

    # DB files
    for db_file in Path(".").glob("progress*.db"):
        if "backup" in db_file.name:
            continue
            
        try:
            conn = sqlite3.connect(str(db_file))
            cursor = conn.cursor()
            
            # Get table names
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            for table in tables:
                table_name = table[0]
                try:
                    # Generic query
                    cursor.execute(f"SELECT * FROM \"{table_name}\"")
                    rows = cursor.fetchall()
                    for row in rows:
                        # try to find string digits in row
                        for col in row:
                            if isinstance(col, str) and col.isdigit() and len(col) > 5:
                                successful_checks.add(col)
                                # usually check_number is 1st column
                except:
                    pass
            conn.close()
        except Exception as e:
            print(f"Error reading {db_file}: {e}")

    return successful_checks

def main():
    # Load the new_failed_checks.json
    try:
        with open("new_failed_checks.json", "r", encoding='utf-8') as f:
            potential_failures = set(json.load(f))
    except (FileNotFoundError, json.JSONDecodeError):
        print("new_failed_checks.json not found or invalid. Run count_failed_checks.py first.")
        # Attempt to run count_failed_checks logic here if file missing? 
        # Better to just fail and ask user to ensure step 1 was done.
        return

    print(f"Loaded {len(potential_failures)} potential failures to verify.")

    successful_checks = get_all_successful_checks()
    print(f"Total unique successful checks found in system: {len(successful_checks)}")

    # Filter
    # "True failures" are those in potential_failures that are NOT in successful_checks
    true_failures = potential_failures - successful_checks
    recovered_checks = potential_failures.intersection(successful_checks)
    
    print("-" * 40)
    print(f"Verification Results:")
    print(f"Potential failures (from logs): {len(potential_failures)}")
    print(f"Actually successful (Recovered/Retried): {len(recovered_checks)}")
    print(f"TRUE failures (Never succeeded): {len(true_failures)}")
    print("-" * 40)

    # Save true failures
    output_file = "true_failed_checks.json"
    with open(output_file, "w", encoding='utf-8') as f:
        json.dump(list(true_failures), f, indent=2, ensure_ascii=False)
    print(f"Saved true failures to {output_file}")

if __name__ == "__main__":
    main()
