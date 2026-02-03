@echo off
title Multi-Worker Automation Launcher (2 Workers - Safe Mode)
color 0A

echo ===============================================================================
echo                    MULTI-WORKER AUTOMATION LAUNCHER
echo                              SAFE MODE
echo ===============================================================================
echo.
echo This will:
echo   [1] Kill any existing workers (to pick up latest code)
echo   [2] Open Chrome ONCE for you to login
echo   [3] Extract cookies automatically
echo   [4] Start 2 workers in BACKGROUND (1 per Gemini Key)
echo   [5] Show combined progress in THIS terminal
echo.
echo Total workers: 2 (1 per API key - PREVENTS SUSPENSION)
echo Concurrency: 2 workers x 30 threads = 60 parallel requests!
echo Mode: SAFE MODE (Anti-Suspension Rate Limiting)
echo Daily capacity: 2 keys x 1500 = 3000+ requests
echo ===============================================================================
echo.
pause

echo.
echo Killing existing Python workers...
taskkill /F /IM python.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done!
echo.

python master_controller.py --workers 2

pause
