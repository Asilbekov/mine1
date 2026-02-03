"""
Recover progress from corrupted progress.json file
"""
import json
import re
from pathlib import Path

progress_file = Path("progress.json")

print("Attempting to recover progress from corrupted file...")

try:
    # Read the file with errors ignored
    with open(progress_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Extract all strings that look like check numbers (10-15 digits)
    recovered = re.findall(r'"(\d{10,15})"', content)
    recovered = list(set(recovered))  # Remove duplicates
    
    print(f"Recovered {len(recovered)} unique checks")
    
    # Save recovered progress
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump(recovered, f, ensure_ascii=False, indent=2)
    
    print(f"Saved recovered progress")
    print(f"Total checks: {len(recovered)}")
    
except Exception as e:
    print(f"Recovery failed: {e}")
