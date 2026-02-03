"""
SQLite-based progress tracker - thread-safe, connection-pooled, high-performance
"""
import sqlite3
import json
import threading
from pathlib import Path
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)


class ProgressTracker:
    """
    High-performance, thread-safe progress tracking using SQLite.
    Features:
    - Connection pooling (reuses connections)
    - WAL mode for concurrent reads/writes
    - Optimized pragmas for speed
    - Batch operations
    """
    
    _instances = {}  # Singleton per db_file
    _lock = threading.Lock()
    
    def __new__(cls, db_file=None):
        """Singleton pattern - one instance per database file."""
        if db_file is None:
            try:
                import config
                db_file = config.PROGRESS_DB
            except:
                db_file = "progress.db"
        
        with cls._lock:
            if db_file not in cls._instances:
                instance = super().__new__(cls)
                instance._initialized = False
                cls._instances[db_file] = instance
            return cls._instances[db_file]
    
    def __init__(self, db_file=None):
        if self._initialized:
            return
            
        if db_file is None:
            try:
                import config
                db_file = config.PROGRESS_DB
            except:
                db_file = "progress.db"
        
        self.db_file = db_file
        self._local = threading.local()  # Thread-local storage for connections
        self._init_db()
        self._initialized = True
        logger.info(f"ProgressTracker initialized: {db_file}")
    
    @contextmanager
    def _get_connection(self):
        """Get a thread-local connection (connection pooling)."""
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            self._local.conn = sqlite3.connect(
                self.db_file,
                timeout=10.0,
                check_same_thread=False
            )
            # Apply optimizations once per connection
            self._apply_pragmas(self._local.conn)
        
        try:
            yield self._local.conn
        except sqlite3.Error as e:
            logger.error(f"SQLite error: {e}")
            # Reset connection on error
            try:
                self._local.conn.close()
            except:
                pass
            self._local.conn = None
            raise
    
    def _apply_pragmas(self, conn):
        """Apply SQLite performance optimizations."""
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA cache_size=-64000;")  # 64MB cache
        conn.execute("PRAGMA temp_store=MEMORY;")
        conn.execute("PRAGMA mmap_size=268435456;")  # 256MB memory-mapped I/O
    
    def _init_db(self):
        """Initialize database schema."""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS progress (
                    check_number TEXT PRIMARY KEY,
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_check ON progress(check_number)")
            conn.commit()
    
    def add(self, check_number):
        """Add a single completed check."""
        try:
            with self._get_connection() as conn:
                conn.execute(
                    "INSERT OR IGNORE INTO progress (check_number) VALUES (?)",
                    (str(check_number),)
                )
                conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Error adding check: {e}")
    
    def add_batch(self, check_numbers):
        """Add multiple completed checks (optimized batch insert)."""
        if not check_numbers:
            return
        try:
            with self._get_connection() as conn:
                conn.executemany(
                    "INSERT OR IGNORE INTO progress (check_number) VALUES (?)",
                    [(str(c),) for c in check_numbers]
                )
                conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Error adding batch: {e}")
    
    def contains(self, check_number):
        """Check if a check is completed."""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT 1 FROM progress WHERE check_number = ? LIMIT 1",
                    (str(check_number),)
                )
                return cursor.fetchone() is not None
        except sqlite3.Error as e:
            logger.error(f"Error checking: {e}")
            return False
    
    def get_all(self):
        """Get all completed checks as a set."""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute("SELECT check_number FROM progress")
                return set(row[0] for row in cursor.fetchall())
        except sqlite3.Error as e:
            logger.error(f"Error reading: {e}")
            return set()
    
    def count(self):
        """Get count of completed checks."""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute("SELECT COUNT(*) FROM progress")
                return cursor.fetchone()[0]
        except sqlite3.Error as e:
            logger.error(f"Error counting: {e}")
            return 0
    
    def clear(self):
        """Clear all progress (use with caution!)."""
        try:
            with self._get_connection() as conn:
                conn.execute("DELETE FROM progress")
                conn.commit()
                logger.warning("Progress cleared!")
        except sqlite3.Error as e:
            logger.error(f"Error clearing: {e}")
    
    def export_to_json(self, json_file):
        """Export to JSON for compatibility/backup."""
        try:
            checks = list(self.get_all())
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(checks, f, ensure_ascii=False)
            logger.info(f"Exported {len(checks)} checks to {json_file}")
        except Exception as e:
            logger.error(f"Error exporting to JSON: {e}")


if __name__ == "__main__":
    # Migration tool
    print("Migrating progress.json to progress.db...")
    
    tracker = ProgressTracker()
    
    try:
        with open("progress.json", 'r', encoding='utf-8') as f:
            checks = json.load(f)
        print(f"Loaded {len(checks)} checks from progress.json")
        tracker.add_batch(checks)
        print(f"Migrated {tracker.count()} checks to progress.db")
    except Exception as e:
        print(f"Could not load progress.json: {e}")
    
    print("Done!")

