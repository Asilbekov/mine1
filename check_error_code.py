
import sqlite3
import json
import os

check_id = "25192389115"
db_file = "progress_Асилбекова Июнь тахрирлаш 20303 та.db" # Assuming June based on previous context

try:
    print(f"Checking {check_id} in DB...")
except:
    print("Checking in DB...")

try:
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("SELECT check_number FROM progress WHERE check_number = ?", (check_id,))
    row = cursor.fetchone()
    print(f"In DB: {row is not None}")
    conn.close()
except Exception as e:
    print(f"Error checking DB: {e}")

# Check for 9099 in logs (tail)
print("\nSearching for 9099 in last 1000 lines of log...")
try:
    with open("automation.log", "rb") as f:
        f.seek(0, os.SEEK_END)
        end_pos = f.tell()
        read_size = min(200000, end_pos) # ~200kb
        f.seek(-read_size, os.SEEK_END)
        lines = f.readlines()
        
        found = False
        for line in lines:
            line_str = line.decode('utf-8', errors='replace')
            if "9099" in line_str:
                print(f"Found 9099: {line_str.strip()}")
                found = True
                break
        if not found:
            print("No '9099' found in recent logs.")
            
        # Check for 9999
        found_9999 = False
        for line in lines:
             line_str = line.decode('utf-8', errors='replace')
             if "9999" in line_str:
                 print(f"Found 9999 sample: {line_str.strip()}")
                 found_9999 = True
                 break
        if not found_9999:
             print("No '9999' found in recent logs.")
             
except Exception as e:
    print(f"Error reading log: {e}")
