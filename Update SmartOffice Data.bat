@echo off
echo.
echo ========================================
echo   SmartOffice Data Update
echo ========================================
echo.
echo Importing latest spreadsheets...
echo.

cd /d "%~dp0"
call npx tsx scripts/auto-import-smartoffice.ts

echo.
echo Press any key to close...
pause > nul
