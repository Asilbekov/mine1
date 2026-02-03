
import os

log_file = "automation.log"
try:
    with open(log_file, "rb") as f:
        # Seek to end
        f.seek(0, os.SEEK_END)
        end_pos = f.tell()
        
        # Read last 20000 bytes
        read_size = min(20000, end_pos)
        f.seek(-read_size, os.SEEK_END)
        lines = f.readlines()
        
        # Decode and print last 100 lines
        print("\n".join([line.decode('utf-8', errors='replace').strip() for line in lines[-100:]]))

except Exception as e:
    print(f"Error reading log: {e}")
