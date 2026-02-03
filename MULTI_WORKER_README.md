# Multi-Worker Parallel Processing

## 📋 Overview

This solution runs **10 parallel workers** to process 14,626 checks simultaneously, each worker handling 1/10th of the total workload.

## 🎯 How It Works

### Work Distribution
- **Total Checks**: 14,626
- **Workers**: 10
- **Checks per worker**: ~1,463 checks
- **Distribution Method**: Round-robin (modulo)

### Worker Assignment Example
```
Worker 1: Checks #1, #11, #21, #31, ... (index % 10 == 0)
Worker 2: Checks #2, #12, #22, #32, ... (index % 10 == 1)
Worker 3: Checks #3, #13, #23, #33, ... (index % 10 == 2)
...
Worker 10: Checks #10, #20, #30, #40, ... (index % 10 == 9)
```

## 🚀 Usage

### Quick Start (Recommended)
Just double-click the batch file:
```
run_10_workers.bat
```

This will:
1. Open 10 terminal windows (one per worker)
2. Each worker will process its assigned checks
3. Progress is tracked independently per worker

### Manual Start (Advanced)
Start workers individually in separate terminals:
```bash
# Terminal 1
python automate_worker.py --worker-id 1 --total-workers 10

# Terminal 2
python automate_worker.py --worker-id 2 --total-workers 10

# ... and so on
```

## 📊 Benefits vs. Complex Pipeline Approach

### ✅ Multi-Worker Advantages
1. **Simple & Safe**: No complex async code or race conditions
2. **Independent**: Workers don't interfere with each other
3. **Fault Tolerant**: If one worker crashes, others continue
4. **Progress Tracking**: Each worker saves its own progress
5. **Easy to Monitor**: Each worker has its own visible terminal
6. **Scalable**: Easy to add/remove workers
7. **No Gemini Timeout**: Each worker sends smaller batches

### ⚠️ Things to Watch

1. **Shared Progress File**
   - All workers use the same `progress.json`
   - File locking handled automatically by Python
   - Workers check progress before processing to avoid duplicates

2. **API Rate Limiting**
   - 10 workers = 10x more simultaneous requests
   - Server might temporarily rate-limit you
   - Each worker has built-in delays and retries

3. **Memory Usage**
   - 10 Python processes running simultaneously
   - Ensure you have enough RAM (~500MB per worker = 5GB total)

4. **Gemini API Quota**
   - Each worker uses its own batch limit (900 per batch from config)
   - 10 workers won't exceed Gemini limits since they space out requests

## 🔧 Configuration

### Adjusting Number of Workers

**Reduce to 5 workers** (if system is slow):
```batch
REM In run_10_workers.bat, comment out last 5 workers

REM Or create run_5_workers.bat with --total-workers 5
```

**Increase to 20 workers** (if you have powerful PC):
- Create `run_20_workers.bat`
- Change `--total-workers 20`
- Each worker would process ~731 checks

### Batch Size Per Worker

Edit `config.py`:
```python
BATCH_SIZE = 200  # Reduce if Gemini times out
```

With 10 workers and batch size 200:
- Each batch: 200 CAPTCHAs sent to Gemini
- 10 workers × 200 = 2,000 checks being processed in parallel max

## 📈 Expected Performance

### Single Process (Current)
- **Time**: ~6-8 hours for 14,626 checks
- **Rate**: ~0.5 checks/second

### 10 Workers (Parallel)
- **Time**: ~40-60 minutes for 14,626 checks (10x faster!)
- **Rate**: ~4-5 checks/second total
- **Per worker**: ~0.4-0.5 checks/second

## 🛑 Stopping Workers

### Stop All Workers
1. **Option 1**: Press `Ctrl+C` in each terminal window
2. **Option 2**: Close all terminal windows
3. **Option 3**: Task Manager → End all `python.exe` processes

### Progress is Always Saved
- Each worker saves progress after every 20 checks
- Even if you force-stop, progress is preserved
- Restart the batch file to resume from where you left off

## 🔍 Monitoring Progress

### View in Real-Time
- Each worker terminal shows its progress
- Look for lines like: `Progress: 150/1463 (10.2%)`

### Check Overall Progress
All workers share the same `progress.json`:
```python
import json
with open('progress.json', 'r') as f:
    completed = len(json.load(f))
print(f"Total completed: {completed}/14626")
```

## 🐛 Troubleshooting

### "Too many requests" error
**Solution**: Reduce number of workers or increase delays
```python
# In config.py
REQUEST_DELAY = 2  # Increase from 0 to 2 seconds
```

### Workers processing same checks
**Shouldn't happen** - but if it does:
- Workers check `progress.json` before processing
- Duplicates are detected and skipped
- Worst case: Wasted API calls, but no data corruption

### One worker much slower
- Normal! Some check batches have harder CAPTCHAs
- Workers process different checks, so speed varies
- Slowest worker determines total completion time

### Gemini timeout with 200 batch
**Solution**: Reduce batch size in `config.py`
```python
BATCH_SIZE = 100  # Reduce from 200 to 100
```

## 📝 Log Files

Each worker shares the same `automation.log`:
- Look for `Worker X/10` to see which worker logged what
- Tip: Use `grep "Worker 1"` to filter logs by worker (Linux/Mac)
- Or search for "Worker 1" in your text editor

## 🎓 Advanced: Dry Run Testing

Test worker distribution without processing:
```bash
python automate_worker.py --worker-id 1 --total-workers 10 --limit 10 --dry-run
```

This shows which checks Worker 1 would process without actually running them.

---

**Ready to go 10x faster? Double-click `run_10_workers.bat`!** 🚀
