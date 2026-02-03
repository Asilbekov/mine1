
import sqlite3
import json
from pathlib import Path

# Load true failed checks
try:
    with open("true_failed_checks.json", "r") as f:
        failed_checks = set(json.load(f))
    print(f"Total Failed Checks to Retry: {len(failed_checks)}")
except Exception as e:
    print(f"Error loading json: {e}")
    exit()

# Scan all progress DBs
total_in_db = 0
db_files = list(Path(".").glob("progress_*.db"))

print("\nScanning Databases:")
for db_path in db_files:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all check numbers from this DB
        cursor.execute("SELECT check_number FROM progress")
        db_checks = set(row[0] for row in cursor.fetchall())
        conn.close()
        
        # Intersection
        overlap = len(failed_checks.intersection(db_checks))
        total_in_db += overlap
        
        try:
             print(f"{db_path.name}: Contains {overlap} of the failed checks")
        except UnicodeEncodeError:
             print(f"{db_path.name.encode('utf-8', 'replace')}: Contains {overlap} of the failed checks")
        
    except Exception as e:
        print(f"Error scanning file: {e}")

print(f"\nSummary:")
print(f"Total Retry Checks: {len(failed_checks)}")
print(f"Already in Databases: {total_in_db}")
print(f"Actually Remaining to Fix: {len(failed_checks) - total_in_db}")
