"""
Worker-based automation for parallel processing.
Each worker processes only their assigned subset of checks.

Features:
- Modulo-based check distribution
- Per-worker Gemini API key assignment
- Dynamic Excel file assignment

Usage:
    python automate_worker.py --worker-id 1 --total-workers 10
"""

import sys
import argparse
from automate_checks import CheckAutomation, logger
import config


class WorkerAutomation(CheckAutomation):
    """Extended automation with worker-based filtering."""
    
    def __init__(self, worker_id, total_workers):
        super().__init__()
        self.worker_id = worker_id
        self.total_workers = total_workers
        logger.info(f"Worker {worker_id}/{total_workers} initialized")
    
    def handle_session_expired(self):
        """
        Override parent method - workers don't refresh session independently.
        Master controller handles session refresh before starting workers.
        """
        logger.error(f"Worker {self.worker_id}: Session expired!")
        logger.error("   Please restart master_controller.py to refresh session")
        return False
    
    def load_checks_from_excel(self):
        """
        Load checks and filter for this worker.
        
        If self.checks_file is set, filters for those checks first.
        Then applies modulo-based distribution for the worker.
        """
        import json
        from pathlib import Path

        all_checks = super().load_checks_from_excel()
        
        if not all_checks:
            return []

        # Filter by specific checks file if provided
        if hasattr(self, 'checks_file') and self.checks_file:
            try:
                checks_path = Path(self.checks_file)
                if checks_path.exists():
                    with open(checks_path, 'r', encoding='utf-8') as f:
                        target_checks = set(json.load(f))
                    
                    original_count = len(all_checks)
                    
                    # Create a new list with check data from the JSON file
                    filtered_checks = []
                    for check_number in target_checks:
                        # Find the check in all_checks by matching check_number
                        found = False
                        for check in all_checks:
                            if str(check['check_number']) == str(check_number):
                                filtered_checks.append(check)
                                found = True
                                break
                        
                        if not found:
                            # If check not found in Excel, create a minimal check entry
                            logger.warning(f"Check {check_number} from {self.checks_file} not found in Excel, creating minimal entry")
                            filtered_checks.append({
                                'check_number': str(check_number),
                                'payment_id': f"EP000000000551{str(check_number).zfill(16)}",  # Default terminal ID with padded check number
                                'row_index': 0,  # Default row index
                                'payment_details': [{
                                    "price": 0,
                                    "amount": 0,
                                    "vatPercent": "0",
                                    "vat": "0",
                                    "discount": 0,
                                    "other": 0,
                                    "productCode": "10701001018000000",
                                    "vaucher": 0,
                                    "packageCode": "1495029",
                                    "unitName": None,
                                    "commissionTin": "62409036610049",
                                    "commissionPinfl": ""
                                }],
                                'tin': "304739262",  # Default TIN
                                'terminal_id': "EP000000000551",  # Default terminal ID
                                'payment_date': "2025-10-12"  # Default payment date
                            })
                    
                    all_checks = filtered_checks
                    logger.info(f"Created {len(all_checks)} checks from {self.checks_file}")
                    
                    # Force retry: Remove these checks from self.progress so they are not skipped
                    if hasattr(self, 'progress') and self.progress:
                        before_count = len(self.progress)
                        # Remove the check numbers from progress to force retry
                        self.progress = {p for p in self.progress if p not in target_checks}
                        logger.info(f"Removed {before_count - len(self.progress)} checks from progress memory to force retry")
                else:
                    logger.warning(f"Checks file not found: {self.checks_file}")
            except Exception as e:
                logger.error(f"Error loading checks file: {e}")

        if not all_checks:
            logger.warning("No checks remaining after filter")
            return []
        
        # Filter checks for this worker using modulo
        # Note: We filter on the SUBSET so that work is evenly distributed
        worker_checks = [
            check for idx, check in enumerate(all_checks)
            if idx % self.total_workers == (self.worker_id - 1)
        ]
        
        logger.info(f"Worker {self.worker_id}: Assigned {len(worker_checks)}/{len(all_checks)} checks")
        
        return worker_checks

def main():
    """Main entry point for worker."""
    parser = argparse.ArgumentParser(description='Worker-based check automation')
    parser.add_argument('--worker-id', type=int, required=True, 
                        help='Worker ID (1-based)')
    parser.add_argument('--total-workers', type=int, required=True,
                        help='Total number of workers')
    parser.add_argument('--excel-file', type=str, help='Specific Excel file to process')
    parser.add_argument('--limit', type=int, help='Limit number of checks (for testing)')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode')
    parser.add_argument('--checks-file', type=str, help='JSON file containing specific check numbers to process')
    
    args = parser.parse_args()
    
    # Validate worker ID
    if not (1 <= args.worker_id <= args.total_workers):
        logger.error(f"Invalid worker ID: {args.worker_id}. Must be 1-{args.total_workers}")
        sys.exit(1)
    
    logger.info("=" * 60)
    logger.info(f"WORKER {args.worker_id}/{args.total_workers} STARTING")
    logger.info("=" * 60)
    
    try:
        # Assign Gemini API key based on worker ID (round-robin)
        if hasattr(config, 'GEMINI_API_KEYS') and config.GEMINI_API_KEYS:
            key_index = (args.worker_id - 1) % len(config.GEMINI_API_KEYS)
            config.GEMINI_API_KEY = config.GEMINI_API_KEYS[key_index]
            logger.info(f"Worker {args.worker_id} using Gemini Key #{key_index + 1}")

        automation = WorkerAutomation(
            worker_id=args.worker_id,
            total_workers=args.total_workers
        )
        if args.checks_file:
            automation.checks_file = args.checks_file

        # Override Excel file if provided
        if args.excel_file:
            config.EXCEL_FILE = args.excel_file
            from pathlib import Path
            _excel_basename = Path(config.EXCEL_FILE).stem
            config.PROGRESS_FILE = f"progress_{_excel_basename}.json"
            config.PROGRESS_DB = f"progress_{_excel_basename}.db"
            logger.info(f"Worker {args.worker_id} assigned to: {config.EXCEL_FILE}")
            
            # Reinitialize ProgressTracker with correct DB
            from progress_db import ProgressTracker
            automation.progress_tracker = ProgressTracker(config.PROGRESS_DB)
            automation.progress = automation.progress_tracker.get_all()
            logger.info(f"Loaded {len(automation.progress)} completed checks")

        automation.run(limit=args.limit, dry_run=args.dry_run)
        
    except KeyboardInterrupt:
        logger.info(f"Worker {args.worker_id} interrupted. Progress saved.")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Worker {args.worker_id} error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

