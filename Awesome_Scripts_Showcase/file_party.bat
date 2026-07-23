@echo off
setlocal EnableExtensions
set "folder=%~dp0Party_Files"
if not exist "%folder%" mkdir "%folder%" >nul 2>&1

echo Created a party folder at:
echo %folder%
echo.
dir /b "%~dp0"
echo.
echo Press any key to exit...
pause >nul
endlocal
