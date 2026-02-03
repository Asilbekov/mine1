@echo off
title Multi-Worker Automation (5 Workers - STABLE)
color 0A

echo ===============================================================================
echo                    MULTI-WORKER AUTOMATION LAUNCHER
echo                       5 WORKERS - STABLE MODE
echo ===============================================================================
echo.
echo ACTIVE API KEYS (non-suspended):
echo   - Key #1: AIzaSyDOiRuMf2s_DC7iaBWnNVsYN6JQR5v-rOE
echo   - Key #2: AIzaSyCyYu8r2czO0AAz7trrRJ9jv4jBMk0DllA
echo   - Key #3: AIzaSyChPWoKZ-9Szt2F_i7O7HDlWgcW0tqXdz4
echo   - Key #7: AIzaSyBghFXNo9Nn9Krr9MGGGxK-Ue9n8FA3ug8
echo   - Key #8: AIzaSyAzOelg-lo_6I0RUSvVCrKiEiJfy1SKpqs
echo.
echo SAFETY FEATURES:
echo   - 5 API keys (1 per worker = NO Google suspension)
echo   - Reduced concurrency (10 uploads/worker)
echo   - Fixed delays between requests (smooth CPU usage)
echo   - Exponential backoff for server errors 9999
echo.
echo CAPACITY: 5 keys x 14 RPM = 70 requests/minute (safe)
echo ===============================================================================
echo.
pause

echo.
echo Killing existing Python workers...
taskkill /F /IM python.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done!
echo.

echo Starting 5 workers with staggered delays...
python master_controller.py --workers 5

pause
