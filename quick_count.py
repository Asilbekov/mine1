#!/usr/bin/env python3
import json

# Count from progress.json
with open('progress.json', 'r') as f:
    data = json.load(f)
    successful_count = len(data)
    print(f"Successful checks from progress.json: {successful_count}")

# Try to count from automation.log
count = 0
try:
    with open('automation.log', 'r') as f:
        for line in f:
            if '[INFO] [OK] Check' in line and 'submitted successfully' in line:
                count += 1
    print(f"Successful checks from automation.log: {count}")
except:
    pass

# Check database if it exists
try:
    import sqlite3
    conn = sqlite3.connect('progress.db')
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM checks WHERE status = 'completed'")
    db_count = cursor.fetchone()[0]
    print(f"Completed checks in progress.db: {db_count}")
    conn.close()
except:
    pass
