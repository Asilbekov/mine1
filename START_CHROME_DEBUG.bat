@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================
echo Chrome Remote Debugging Starter
echo ========================================
echo.

echo [1/4] Killing all Chrome processes...
taskkill /F /IM chrome.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ^> Chrome processes killed
) else (
    echo    ^> No Chrome processes found
)

echo.
echo [2/4] Waiting for Chrome to fully close...
timeout /t 3 /nobreak >nul

REM Check for common Chrome installation paths
set CHROME_PATH=""
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if !CHROME_PATH! EQU "" (
    echo.
    echo [ERROR] Chrome not found in standard locations!
    echo Please install Google Chrome or update the path in this script.
    echo.
    pause
    exit /b 1
)

echo [3/4] Found Chrome at: !CHROME_PATH!

REM Create a temporary profile to avoid conflicts
set TEMP_PROFILE=%TEMP%\chrome_debug_profile
if not exist "%TEMP_PROFILE%" (
    mkdir "%TEMP_PROFILE%"
)

echo.
echo [4/4] Starting Chrome with remote debugging...
echo    ^> Port: 9222
echo    ^> Profile: %TEMP_PROFILE%
echo    ^> URL: https://my3.soliq.uz
echo.

REM Start Chrome with debugging enabled
start "" !CHROME_PATH! ^
    --remote-debugging-port=9222 ^
    --user-data-dir="%TEMP_PROFILE%" ^
    --no-first-run ^
    --no-default-browser-check ^
    https://my3.soliq.uz

REM Wait a bit for Chrome to start
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Chrome Started Successfully!
echo ========================================
echo.
echo Debugging Port: 9222
echo Profile: Temporary (clean session)
echo.
echo IMPORTANT: You need to login again!
echo (This uses a temporary profile, so no saved cookies)
echo.
echo After logging in, run:
echo    python refresh_cookies.py
echo.
echo Or use the simpler alternative:
echo    python simple_cookie_extractor.py
echo    (This doesn't need debugging mode)
echo.
pause
