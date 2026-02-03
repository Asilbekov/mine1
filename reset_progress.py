"""
Reset progress files that were contaminated by the bug.
This will keep September's progress intact but reset the others.
"""

import os
from pathlib import Path

# Files to reset (all except September which is the "reference")
files_to_reset = [
    "progress_Асилбекова_Август_тахрирлаш_48606_та.json",
    "progress_Асилбекова_Август_тахрирлаш_48606_та.db",
    "progress_Асилбекова Июнь тахрирлаш 20303 та.json",
    "progress_Асилбекова Июнь тахрирлаш 20303 та.db",
    "progress_Асилбекова Июль тахрирлаш 46430 та.json",
    "progress_Асилбекова Июль тахрирлаш 46430 та.db",
]

print("Resetting contaminated progress files...\n")

for filename in files_to_reset:
    filepath = Path(filename)
    if filepath.exists():
        # Backup first
        backup = filepath.with_suffix(filepath.suffix + ".backup")
        os.rename(filepath, backup)
        print(f"✓ Backed up {filename} -> {backup.name}")
        
        # Create empty file
        if filepath.suffix == ".json":
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write("[]")
        elif filepath.suffix == ".db":
            # Delete DB file, it will be recreated
            pass
        print(f"✓ Reset {filename}")
    else:
        print(f"- {filename} not found (skipping)")

print("\n✅ Done! You can now restart master_controller.py")
print("   Backups are saved with .backup extension if you need to restore.")
