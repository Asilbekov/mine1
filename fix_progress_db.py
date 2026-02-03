"""
Complete fix: Make both progress.json AND progress.db dynamic
This prevents conflicts when switching between different Excel files
"""

import re

# Read config.py
with open('config.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add PROGRESS_DB configuration right after PROGRESS_FILE
# Find the line after PROGRESS_FILE definition
pattern = r'(PROGRESS_FILE = f"progress_\{_excel_basename\}\.json")'
replacement = r'\1\nPROGRESS_DB = f"progress_{_excel_basename}.db"  # SQLite database file'

content = re.sub(pattern, replacement, content)

# Write back
with open('config.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Step 1: config.py updated with PROGRESS_DB")

# Now update progress_db.py to use config.PROGRESS_DB instead of hardcoded value
with open('progress_db.py', 'r', encoding='utf-8') as f:
    db_content = f.read()

# Replace the hardcoded db_file with config import
old_init = r'    def __init__\(self, db_file="progress\.db"\):'
new_init = '''    def __init__(self, db_file=None):
        if db_file is None:
            try:
                import config
                db_file = config.PROGRESS_DB
            except:
                db_file = "progress.db"  # Fallback'''

db_content = re.sub(old_init, new_init, db_content)

with open('progress_db.py', 'w', encoding='utf-8') as f:
    f.write(db_content)

print("Step 2: progress_db.py updated to use dynamic database file")
print("")
print("Done! Now each Excel file gets:")
print("  - Separate JSON: progress_ExcelName.json")
print("  - Separate DB:   progress_ExcelName.db")
