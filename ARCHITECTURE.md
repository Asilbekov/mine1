# Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   USER (You)                                │
│  Double-clicks: run_10_workers.bat                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          MASTER CONTROLLER (master_controller.py)           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  STEP 1: Session Refresh                             │   │
│  │  - Opens Chrome ONCE                                 │   │
│  │  - Waits for your login                             │   │
│  │  - Extracts cookies                                  │   │
│  │  - Saves to config.py                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  STEP 2: Start Workers                               │   │
│  │  - Spawns 10 background processes                    │   │
│  │  - Each worker gets assigned checks                  │   │
│  │  - Workers run silently (no UI)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  STEP 3: Monitor Progress                            │   │
│  │  - Reads progress.json every 5 seconds              │   │
│  │  - Calculates combined stats                        │   │
│  │  - Displays in terminal                             │   │
│  └──────────────────────────────────────────────────────┘   │
└───────┬──────┬──────┬──────┬──────┬──────┬──────┬─────┬────┘
        │      │      │      │      │      │      │     │
        ▼      ▼      ▼      ▼      ▼      ▼      ▼     ▼    (continues...)
     ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
     │Worker││Worker││Worker││Worker││Worker││Worker││Worker││Worker│
     │  1   ││  2   ││  3   ││  4   ││  5   ││  6   ││  7   ││  8   │
     └───┬──┘└───┬──┘└───┬──┘└───┬──┘└───┬──┘└───┬──┘└───┬──┘└───┬──┘
         │       │       │       │       │       │       │       │
         │  ┌──────────────────────────────────────────┐ │       │
         └─►│         Shared Resources                 │◄┴───────┘
            │                                          │
            │  ✓ config.py (session cookies)           │
            │  ✓ progress.json (completed checks)      │
            │  ✓ automation.log (all logs)             │
            │  ✓ АСИЛБЕКОВА.zip (read-only)            │
            └──────────────────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │      my3.soliq.uz API         │
            │  (uploads, CAPTCHAs, submits) │
            └───────────────────────────────┘
```

## 🔄 Worker Process Flow

Each worker independently runs:

```
Worker N starts
     │
     ▼
Load assigned checks (every 10th check)
     │
     ▼
For each check:
     │
     ├─► Upload ZIP file
     │        │
     │        ▼
     │   Get file_id
     │        │
     ├─► Fetch CAPTCHA  
     │        │
     │        ▼
     │   Get captcha_id + image
     │        │
     ├─► Solve CAPTCHA (Gemini)
     │        │
     │        ▼
     │   Get solution
     │        │
     └─► Submit check
              │
              ▼
         Mark as done in progress.json
              │
              ▼
         Next check
```

## 📊 Data Flow

```
Excel File (14,626 rows)
        │
        ▼
Master Controller loads all checks
        │
        ├─► Worker 1: Checks #1, #11, #21, ... (1,463 checks)
        ├─► Worker 2: Checks #2, #12, #22, ... (1,463 checks)
        ├─► Worker 3: Checks #3, #13, #23, ... (1,463 checks)
        ├─► Worker 4: Checks #4, #14, #24, ... (1,463 checks)
        ├─► Worker 5: Checks #5, #15, #25, ... (1,463 checks)
        ├─► Worker 6: Checks #6, #16, #26, ... (1,463 checks)
        ├─► Worker 7: Checks #7, #17, #27, ... (1,462 checks)
        ├─► Worker 8: Checks #8, #18, #28, ... (1,462 checks)
        ├─► Worker 9: Checks #9, #19, #29, ... (1,462 checks)
        └─► Worker 10: Checks #10, #20, #30, ... (1,462 checks)
                │
                └─► All workers write to progress.json
                            │
                            ▼
                Master reads progress.json every 5 sec
                            │
                            ▼
                    Shows combined progress
```

## 🎯 Key Benefits

### Centralized Control
- **One login**: Master handles authentication
- **One monitor**: Single terminal for all progress
- **Shared cookies**: All workers use same session

### Parallel Execution
- **10x speedup**: Workers process simultaneously
- **Independent**: One worker crash doesn't affect others
- **Load balanced**: Round-robin distribution

### Simple UX
- **One click**: Start everything with batch file
- **One window**: See all progress in one place
- **One file**: All logs in automation.log

## 🔒 Thread Safety

All workers safely share files:

| File | Access | Conflict Prevention |
|------|--------|-------------------|
| `config.py` | Read-only | No conflicts |
| `АСИЛБЕКОВА.zip` | Read-only | No conflicts |
| `progress.json` | Read/Write | Python's atomic JSON operations |
| `automation.log` | Write | Python's thread-safe logging |

Workers check `progress.json` before processing to avoid doing the same check twice!
