"""
Test script to verify worker distribution
Shows how checks are divided among workers without actually processing them
"""

import sys
# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from automate_worker import WorkerAutomation
import config


def test_distribution(total_workers=10):
    """Test how checks are distributed among workers"""
    
    print("=" * 80)
    print(f"TESTING WORKER DISTRIBUTION WITH {total_workers} WORKERS")
    print("=" * 80)
    print()
    
    # Load all checks once
    temp_worker = WorkerAutomation(1, total_workers)
    all_checks = super(WorkerAutomation, temp_worker).load_checks_from_excel()
    
    if not all_checks:
        print("❌ No checks loaded from Excel!")
        return
    
    print(f"✅ Loaded {len(all_checks)} total checks from Excel")
    print()
    
    # Test each worker
    total_assigned = 0
    for worker_id in range(1, total_workers + 1):
        worker = WorkerAutomation(worker_id, total_workers)
        worker_checks = worker.load_checks_from_excel()
        
        # Show first 5 check numbers for this worker
        sample_checks = [c['check_number'] for c in worker_checks[:5]]
        
        print(f"Worker {worker_id:2d}: {len(worker_checks):5d} checks | "
              f"First 5: {', '.join(sample_checks)}")
        
        total_assigned += len(worker_checks)
    
    print()
    print("=" * 80)
    print(f"VERIFICATION:")
    print(f"Total checks in Excel:     {len(all_checks)}")
    print(f"Total checks assigned:     {total_assigned}")
    print(f"Match: {'✅ YES' if total_assigned == len(all_checks) else '❌ NO - ERROR!'}")
    print("=" * 80)
    print()
    
    # Calculate expected time savings
    print("ESTIMATED PERFORMANCE:")
    print(f"Single worker time:  ~6-8 hours")
    print(f"With {total_workers} workers:   ~{(6 * 60) // total_workers}-{(8 * 60) // total_workers} minutes ({total_workers}x faster!)")
    print()


if __name__ == "__main__":
    import sys
    
    workers = 10
    if len(sys.argv) > 1:
        workers = int(sys.argv[1])
    
    test_distribution(workers)
