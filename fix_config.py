"""
Quick fix to make PROGRESS_FILE dynamic based on Excel filename
This prevents conflicts when switching between different Excel files
"""

import re

# Read config.py
with open('config.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the PROGRESS_FILE line
old_pattern = r'PROGRESS_FILE = "progress\.json"'
new_line = '''# PROGRESS_FILE is now dynamic - each Excel file gets its own progress
from pathlib import Path as _Path
_excel_basename = _Path(EXCEL_FILE).stem
PROGRESS_FILE = f"progress_{_excel_basename}.json"'''

content = re.sub(old_pattern, new_line, content)

# Write back
with open('config.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("config.py updated successfully!")
print("Now each Excel file will have its own progress file")
print("Example: progress_Asilbekova_September.json")
