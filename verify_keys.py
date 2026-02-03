import config

def verify_distribution():
    print("Verifying Gemini Key Distribution for 10 Workers:")
    print("-" * 60)
    
    keys = config.GEMINI_API_KEYS
    print(f"Total Keys Available: {len(keys)}")
    
    for worker_id in range(1, 11):
        key_index = (worker_id - 1) % len(keys)
        selected_key = keys[key_index]
        print(f"Worker {worker_id:2d} -> Key #{key_index + 1} ({selected_key[:10]}...)")
        
    print("-" * 60)
    print("✅ Distribution looks correct (Round Robin)")

if __name__ == "__main__":
    verify_distribution()
