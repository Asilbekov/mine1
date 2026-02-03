#!/usr/bin/env python3
"""
Enhanced Successful Checks Counter

This script counts successful checks from multiple sources:
- Automation log files (including subdirectories)
- Progress databases (SQLite files)
- Progress JSON files

It uses multiple data sources to provide comprehensive counting of successful checks.
"""

import argparse
import re
import sys
import json
import sqlite3
import glob
import os
from datetime import datetime
from typing import List, Dict, Tuple, Optional


def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Count successful checks from automation.log file",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    parser.add_argument(
        "log_file",
        nargs="?",
        default="automation.log",
        help="Path to the automation log file"
    )
    
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output with detailed information"
    )
    
    parser.add_argument(
        "-b", "--use-batch-reports",
        action="store_true",
        help="Use batch reports as secondary counting method"
    )
    
    parser.add_argument(
        "-d", "--detailed-stats",
        action="store_true",
        help="Generate detailed statistics by date/time"
    )
    
    parser.add_argument(
        "-j", "--json",
        action="store_true",
        help="Output results in JSON format"
    )
    
    parser.add_argument(
        "-a", "--all-sources",
        action="store_true",
        help="Count from all available sources (logs, databases, JSON files)"
    )
    
    parser.add_argument(
        "-l", "--log-directory",
        action="store_true",
        help="Process all log files in current directory and subdirectories"
    )
    
    parser.add_argument(
        "-db", "--include-databases",
        action="store_true",
        help="Include progress databases (SQLite files) in counting"
    )
    
    parser.add_argument(
        "-jf", "--include-json-files",
        action="store_true",
        help="Include progress JSON files in counting"
    )
    
    return parser.parse_args()


def count_from_json_files() -> Tuple[int, List[str]]:
    """
    Count successful checks from all progress JSON files.
    
    Returns:
        Tuple of (total_count, list_of_file_paths)
    """
    total = 0
    files_processed = []
    
    # Look for all progress*.json files (excluding backups)
    json_files = glob.glob('progress*.json')
    
    for json_file in json_files:
        if 'backup' in json_file:
            continue
            
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                count = len(data)
                total += count
                files_processed.append(f"{json_file}: {count}")
        except Exception as e:
            print(f"Warning: Could not read {json_file}: {e}", file=sys.stderr)
    
    return total, files_processed


def count_from_databases() -> Tuple[int, List[str]]:
    """
    Count successful checks from all progress databases (SQLite files).
    
    Returns:
        Tuple of (total_count, list_of_file_paths)
    """
    total = 0
    files_processed = []
    
    # Look for all progress*.db files (excluding backups)
    db_files = glob.glob('progress*.db')
    
    for db_file in db_files:
        if 'backup' in db_file:
            continue
            
        try:
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            
            # Try to get count from the database
            # The table structure might vary, so we try different approaches
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            for table in tables:
                table_name = table[0]
                if 'progress' in table_name.lower() or 'check' in table_name.lower():
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                        count = cursor.fetchone()[0]
                        total += count
                        files_processed.append(f"{db_file} ({table_name}): {count}")
                        break
                    except:
                        continue
            
            conn.close()
        except Exception as e:
            print(f"Warning: Could not read {db_file}: {e}", file=sys.stderr)
    
    return total, files_processed


def find_all_log_files() -> List[str]:
    """
    Find all automation log files in current directory and subdirectories.
    
    Returns:
        List of log file paths
    """
    log_files = []
    
    # Look for automation.log in current directory
    if os.path.exists('automation.log'):
        log_files.append('automation.log')
    
    # Look for automation.log in subdirectories
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file == 'automation.log':
                log_files.append(os.path.join(root, file))
    
    return log_files


def match_success_pattern(line: str) -> Optional[re.Match]:
    """
    Match the primary success pattern in a log line.
    
    Args:
        line: A line from the log file
        
    Returns:
        Match object if pattern matches, None otherwise
    """
    # Regex to match: [INFO] [OK] Check 26520803166 submitted successfully
    pattern = r'\[INFO\] \[OK\] Check (\d+) submitted successfully'
    return re.search(pattern, line)


def match_batch_pattern(line: str) -> Optional[re.Match]:
    """
    Match the batch report pattern in a log line.
    
    Args:
        line: A line from the log file
        
    Returns:
        Match object if pattern matches, None otherwise
    """
    # Regex to match: Batch complete: 25 successful, 5 failed
    pattern = r'Batch complete: (\d+) successful, (\d+) failed'
    return re.search(pattern, line)


def extract_check_data(match: re.Match, line_number: int) -> Dict:
    """
    Extract check data from a successful match.
    
    Args:
        match: The regex match object
        line_number: The line number in the log file
        
    Returns:
        Dictionary containing check data
    """
    # Extract timestamp from the beginning of the line if available
    # The timestamp format can vary, so we'll use a flexible approach
    check_number = match.group(1)
    
    return {
        'check_number': check_number,
        'line_number': line_number
    }


def extract_batch_data(match: re.Match, line_number: int) -> Dict:
    """
    Extract batch report data from a batch match.
    
    Args:
        match: The regex match object
        line_number: The line number in the log file
        
    Returns:
        Dictionary containing batch data
    """
    successful = int(match.group(1))
    failed = int(match.group(2))
    
    return {
        'successful': successful,
        'failed': failed,
        'total': successful + failed,
        'line_number': line_number
    }


def process_log_file(file_path: str, options: argparse.Namespace) -> Dict:
    """
    Process the log file to count successful checks.
    
    Args:
        file_path: Path to the log file
        options: Command line options
        
    Returns:
        Dictionary containing the results
    """
    results = {
        'total_successful': 0,
        'successful_checks': [],
        'batch_reports': [],
        'file_path': file_path,
        'processing_time': None
    }
    
    start_time = datetime.now()
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line_number, line in enumerate(file, 1):
                # Check for primary success pattern
                success_match = match_success_pattern(line)
                if success_match:
                    results['total_successful'] += 1
                    if options.detailed_stats or options.verbose:
                        check_data = extract_check_data(success_match, line_number)
                        results['successful_checks'].append(check_data)
                
                # Check for batch report pattern if enabled
                if options.use_batch_reports:
                    batch_match = match_batch_pattern(line)
                    if batch_match:
                        batch_data = extract_batch_data(batch_match, line_number)
                        results['batch_reports'].append(batch_data)
                        
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.", file=sys.stderr)
        sys.exit(1)
    except PermissionError:
        print(f"Error: Permission denied when accessing '{file_path}'.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    
    end_time = datetime.now()
    results['processing_time'] = (end_time - start_time).total_seconds()
    
    return results


def generate_report(results: Dict, options: argparse.Namespace) -> None:
    """
    Generate and display a report based on the results.
    
    Args:
        results: Dictionary containing the processing results
        options: Command line options
    """
    if options.json:
        import json
        print(json.dumps(results, indent=2))
        return
    
    # Standard text output
    print(f"Log file: {results['file_path']}")
    print(f"Total successful checks: {results['total_successful']}")
    
    if options.use_batch_reports and results['batch_reports']:
        batch_successful = sum(r['successful'] for r in results['batch_reports'])
        batch_failed = sum(r['failed'] for r in results['batch_reports'])
        print(f"Batch reports indicate: {batch_successful} successful, {batch_failed} failed")
        
        # Compare methods
        if batch_successful != results['total_successful']:
            print(f"Warning: Discrepancy detected between counting methods")
            print(f"  Individual count: {results['total_successful']}")
            print(f"  Batch report total: {batch_successful}")
    
    if options.verbose:
        print(f"\nProcessing completed in {results['processing_time']:.2f} seconds")
        
        if results['successful_checks']:
            print(f"\nFirst few successful checks:")
            for check in results['successful_checks'][:5]:
                print(f"  Check {check['check_number']} at line {check['line_number']}")
            if len(results['successful_checks']) > 5:
                print(f"  ... and {len(results['successful_checks']) - 5} more")
        
        if options.use_batch_reports and results['batch_reports']:
            print(f"\nBatch reports found:")
            for batch in results['batch_reports'][:3]:
                print(f"  {batch['successful']} successful, {batch['failed']} failed (line {batch['line_number']})")
            if len(results['batch_reports']) > 3:
                print(f"  ... and {len(results['batch_reports']) - 3} more")
    
    if options.detailed_stats and results['successful_checks']:
        generate_detailed_report(results['successful_checks'])


def generate_detailed_report(successful_checks: List[Dict]) -> None:
    """
    Generate a detailed report based on successful check data.
    
    Args:
        successful_checks: List of dictionaries containing successful check data
    """
    # Group by check number prefix for basic categorization
    prefixes = {}
    for check in successful_checks:
        check_num = check['check_number']
        prefix = check_num[:3] if len(check_num) >= 3 else check_num
        if prefix not in prefixes:
            prefixes[prefix] = 0
        prefixes[prefix] += 1
    
    print(f"\nDetailed statistics by check number prefix:")
    for prefix in sorted(prefixes.keys()):
        print(f"  {prefix}xx: {prefixes[prefix]} checks")
    
    print(f"\nTotal unique check numbers: {len(set(c['check_number'] for c in successful_checks))}")


def main():
    """Main function to orchestrate the script execution."""
    args = parse_arguments()
    
    # Process the log file
    results = process_log_file(args.log_file, args)
    
    # Generate and display the report
    generate_report(results, args)


if __name__ == "__main__":
    main()