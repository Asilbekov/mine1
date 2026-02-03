"""
Script to restore progress.json from automation.log
"""
import json
import re
import sys
from pathlib import Path

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def restore_progress():
    log_file = Path("automation.log")
    progress_file = Path("progress.json")
    
    if not log_file.exists():
        print("❌ automation.log not found!")
        return

    print(f"📖 Reading {log_file}...")
    
    # Patterns to look for success messages
    # 1. "[OK] Check 12345 submitted successfully"
    # 2. "Batch item success: 12345"
    # 3. "Check 12345 already submitted"
    
    patterns = [
        r"\[OK\] Check (\d+) submitted successfully",
        r"Batch item success: (\d+)",
        r"Check (\d+) already submitted",
        r"Skipping already processed check: (\d+)"
    ]
    
    restored_checks = set()
    
    # Also read existing progress.json if it exists
    if progress_file.exists():
        try:
            with open(progress_file, 'r') as f:
                existing = json.load(f)
                restored_checks.update(existing)
            print(f"ℹ️  Found {len(restored_checks)} checks in existing progress.json")
        except:
            pass
            
    # Scan log file
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            for pattern in patterns:
                match = re.search(pattern, line)
                if match:
                    check_num = match.group(1)
                    restored_checks.add(check_num)

    print(f"✅ Found {len(restored_checks)} unique completed checks in logs")
    
    # Save restored progress
    with open(progress_file, 'w') as f:
        json.dump(list(restored_checks), f, indent=2)
        
    print(f"💾 Saved restored progress to {progress_file}")

if __name__ == "__main__":
    restore_progress()
