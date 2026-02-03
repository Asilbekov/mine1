@echo off
title Multi-Worker Automation (9 Workers - SAFE MODE)
color 0A

echo ===============================================================================
echo                    MULTI-WORKER AUTOMATION LAUNCHER
echo                       9 WORKERS - SAFE HIGH-SPEED
echo ===============================================================================
echo.
echo SAFETY FEATURES:
echo   - 9 API keys (1 per worker = NO Google suspension)
echo   - Reduced concurrency (10 uploads/worker instead of 25)
echo   - Staggered worker starts (prevents server overload)
echo   - 0.2s delays between requests
echo.
echo CAPACITY: 9 keys x 12 RPM = 108 requests/minute (safe)
echo ===============================================================================
echo.
pause

echo.
echo Killing existing Python workers...
taskkill /F /IM python.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done!
echo.

echo Starting workers with staggered delays...
python master_controller.py --workers 9

pause
