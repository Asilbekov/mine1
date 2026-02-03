
import pandas as pd
from pathlib import Path
import json

def find_check(check_number):
    print(f"Searching for check {check_number} in Excel files...")
    
    excel_files = list(Path(".").glob("*.xlsx"))
    
    for f in excel_files:
        if f.name.startswith("~$"): continue
        
        try:
            filename = f.name
            try:
                print(f"Checking {filename}...")
            except UnicodeEncodeError:
                print(f"Checking {filename.encode('utf-8', 'replace')}...")
            
            # Try loading with pandas for speed (requires openpyxl)
            # Assuming no header or finding header
            # Just reading first sheet
            df = pd.read_excel(f, dtype=str)
            
            # Check all string columns
            found = False
            for col in df.columns:
                if df[col].astype(str).str.contains(check_number, regex=False).any():
                    found = True
                    break
            
            if found:
                try:
                    print(f"FOUND in {filename}")
                except UnicodeEncodeError:
                     print(f"FOUND in {filename.encode('utf-8', 'replace')}")
                return
                
        except Exception as e:
            print(f"Error reading file: {e}")

    print("Not found in any local Excel file.")

if __name__ == "__main__":
    # Load first check from true_failed_checks.json
    try:
        with open("true_failed_checks.json", "r") as f:
            checks = json.load(f)
            if checks:
                find_check(checks[0])
            else:
                print("No checks in true_failed_checks.json")
    except Exception as e:
        print(f"Error: {e}")
