@echo off
title Multi-Worker Automation Launcher (2 Workers)
color 0A

echo ===============================================================================
echo                    MULTI-WORKER AUTOMATION LAUNCHER
echo ===============================================================================
echo.
echo This will:
echo   [1] Kill any existing workers (to pick up latest code)
echo   [2] Open Chrome ONCE for you to login
echo   [3] Extract cookies automatically
echo   [4] Start 2 workers in BACKGROUND
echo   [5] Show combined progress in THIS terminal
echo   [6] AUTO-REDISTRIBUTE workers when a month completes
echo.
echo Total workers: 2 (each with unique Gemini API key)
echo Mode: Sequential months (workers move to next month when current completes)
echo ===============================================================================
echo.
pause

echo.
echo Killing existing Python workers...
taskkill /F /IM python.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done!
echo.

python master_controller.py --workers 2 --checks-file never_succeeded_checks.json

pause
