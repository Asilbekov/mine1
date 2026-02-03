@echo off
REM ====================================================================
REM Improved Multi-Worker Launcher
REM ====================================================================
REM This version:
REM   - Opens Chrome ONCE for cookie refresh
REM   - Press Enter ONCE to start all workers
REM   - All 10 workers run in BACKGROUND
REM   - ONE terminal shows combined progress
REM ====================================================================

echo.
echo ===============================================================================
echo                     MULTI-WORKER AUTOMATION LAUNCHER
echo ===============================================================================
echo.
echo This will:
echo   [1] Open Chrome ONCE for you to login
echo   [2] Extract cookies automatically
echo   [3] Start 10 workers in BACKGROUND
echo   [4] Show combined progress in THIS terminal
echo.
echo Total checks: 14,626
echo Expected time: 36-48 minutes (10x faster!)
echo.
echo ===============================================================================
echo.
pause

REM Run the master controller
python master_controller.py --workers 10

echo.
echo ===============================================================================
echo                            AUTOMATION FINISHED
echo ===============================================================================
echo.
echo All workers have completed their tasks!
echo Check automation.log for detailed information.
echo.
pause
