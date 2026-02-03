
import sqlite3
import json

check_id = "25190418955" # From log
db_file = "progress_Асилбекова Июнь тахрирлаш 20303 та.db"
json_file = "true_failed_checks.json"

print(f"Checking {check_id}...")

# Check JSON
try:
    with open(json_file, 'r') as f:
        failed_checks = set(json.load(f))
    in_json = check_id in failed_checks
    print(f"In {json_file}: {in_json}")
except Exception as e:
    print(f"Error reading JSON: {e}")

# Check DB
try:
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("SELECT check_number FROM progress WHERE check_number = ?", (check_id,))
    row = cursor.fetchone()
    in_db = row is not None
    try:
        print(f"In DB: {in_db}")
    except:
        print(f"In DB: {in_db}")
    conn.close()
except Exception as e:
    # Print repr of filename if it fails to print normally
    print(f"Error reading DB: {e}")
