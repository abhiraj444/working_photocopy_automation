@echo off
echo ================================================
echo WhatsApp Print Bot - Quick Start
echo ================================================
echo.

REM Check if config has been edited
findstr /C:"YOUR_PRINTER_NAME_HERE" mvp\src\config.ts >nul
if %ERRORLEVEL%==0 (
    echo ERROR: Please edit mvp\src\config.ts first!
    echo.
    echo 1. Open: mvp\src\config.ts
    echo 2. Update PRINTER_NAME
    echo 3. Update OWNER_PHONE  
    echo 4. Save and run this script again
    echo.
    pause
    exit /b 1
)

echo Starting Print Server and WhatsApp Bot...
echo.
echo Terminal 1: Print Server
start "Print Server" cmd /k "python print_server.py"

timeout /t 3 /nobreak >nul

echo Terminal 2: WhatsApp Bot  
start "WhatsApp Bot" cmd /k "cd mvp && npm run dev"

echo.
echo ================================================
echo Both servers are starting in separate windows
echo.
echo Scan the QR code in the WhatsApp Bot window
echo ================================================
pause
