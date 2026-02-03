"""
Kill all hung worker processes
"""
import subprocess
import sys

print("Killing all python worker processes...")

# Kill all python processes (be careful!)
if sys.platform == 'win32':
    result = subprocess.run(
        ['taskkill', '/F', '/IM', 'python.exe'],
        capture_output=True,
        text=True
    )
    print(result.stdout)
    print(result.stderr)
else:
    subprocess.run(['pkill', '-9', 'python'])

print("All workers killed. You can now restart with a smaller batch size.")
