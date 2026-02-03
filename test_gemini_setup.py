import config
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger()

def test_gemini_setup():
    print("="*60)
    print("TESTING GEMINI API CONFIGURATION")
    print("="*60)
    
    # 1. Check Config
    print(f"\n1. Checking Config...")
    print(f"   Active Keys: {len(config.GEMINI_API_KEYS)}")
    print(f"   Suspended Keys List: {len(config.SUSPENDED_KEYS)}")
    
    # Verify no suspended keys are in active list
    suspended_in_active = [k for k in config.GEMINI_API_KEYS if k in config.SUSPENDED_KEYS]
    if suspended_in_active:
        print(f"   CRITICAL FAIL: Suspended keys found in active list: {suspended_in_active}")
        return False
    else:
        print(f"   Config Clean: No suspended keys in active list.")

    # 2. Check Solver Initialization
    print(f"\n2. Testing GeminiSolver Initialization...")
    try:
        from gemini_ocr import GeminiSolver
        solver = GeminiSolver()
        
        if solver.api_key:
            print(f"   Solver initialized successfully")
            print(f"   Selected Key: ...{solver.api_key[-6:]}")
            
            if solver.api_key in config.SUSPENDED_KEYS:
                print(f"   FAIL: Solver selected a suspended key!")
                return False
            else:
                print(f"   Selected key is valid (not in suspended list)")
        else:
            print(f"   Solver initialized but NO key selected (Are all keys suspended?)")
            
    except Exception as e:
        print(f"   Solver Init Failed: {e}")
        return False

    # 3. Check Worker Logic (Import only)
    print(f"\n3. Checking Worker Imports...")
    try:
        from automate_worker import WorkerAutomation
        print(f"   Worker module imported successfully")
    except Exception as e:
        print(f"   Worker Import Failed: {e}")
        return False
        
    print("\n" + "="*60)
    print("ALL CHECKS PASSED - SYSTEM READY")
    print("="*60)
    return True

if __name__ == "__main__":
    success = test_gemini_setup()
    sys.exit(0 if success else 1)
