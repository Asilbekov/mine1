@echo off
title Multi-Worker Automation Launcher (8 Workers)
color 0A

echo ===============================================================================
echo                    MULTI-WORKER AUTOMATION LAUNCHER
echo ===============================================================================
echo.
echo This will:
echo   [1] Kill any existing workers (to pick up latest code)
echo   [2] Open Chrome ONCE for you to login
echo   [3] Extract cookies automatically
echo   [4] Start 8 workers in BACKGROUND (1 per Gemini Key)
echo   [5] Show combined progress in THIS terminal
echo.
echo Total workers: 8 (Smart Key Rotation & Load Balancing)
echo Concurrency: 8 workers x 30 threads = 240 parallel requests!
echo Mode: ULTRA PERFORMANCE (Anti-Suspension Protection Enabled)
echo Daily capacity: Scalable based on available keys (Rec: 5+ keys)
echo ===============================================================================
echo.
pause

echo.
echo Killing existing Python workers...
taskkill /F /IM python.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done!
echo.

python master_controller.py --workers 8

pause

