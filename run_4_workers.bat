@echo off
title Multi-Worker Automation Launcher (4 Workers)
color 0A

echo ===============================================================================
echo                    MULTI-WORKER AUTOMATION LAUNCHER
echo ===============================================================================
echo.
echo This will:
echo   [1] Open Chrome ONCE for you to login
echo   [2] Extract cookies automatically
echo   [3] Start 4 workers in BACKGROUND (1 per Gemini Key)
echo   [4] Show combined progress in THIS terminal
echo.
echo Total checks: 14,626
echo Optimized for 4 Gemini API Keys
echo.
echo ===============================================================================
echo.
pause

python master_controller.py --workers 4

pause
