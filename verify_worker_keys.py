"""
Test script to verify worker API key distribution
"""
import config

print("=" * 80)
print("API KEY DISTRIBUTION TEST")
print("=" * 80)

if hasattr(config, 'GEMINI_API_KEYS') and config.GEMINI_API_KEYS:
    print(f"\nTotal API keys available: {len(config.GEMINI_API_KEYS)}")
    print("\nKey assignments for 8 workers:")
    print("-" * 80)
    
    for worker_id in range(1, 9):
        key_index = (worker_id - 1) % len(config.GEMINI_API_KEYS)
        selected_key = config.GEMINI_API_KEYS[key_index]
        print(f"Worker {worker_id} -> Key #{key_index + 1}: ...{selected_key[-10:]}")
    
    print("-" * 80)
    print("\n✓ Each worker should have a UNIQUE key suffix")
    print("✓ If two workers have the same suffix, they're sharing a key!")
else:
    print("ERROR: GEMINI_API_KEYS not found in config.py")
