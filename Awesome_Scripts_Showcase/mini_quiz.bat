@echo off
setlocal EnableExtensions

echo Welcome to the Mini Quiz!
echo.
set /p answer=What is 7 + 8? 
if "%answer%"=="15" (
    echo Correct! Nice work.
) else (
    echo Not quite. The answer is 15.
)
echo.
echo Press any key to exit...
pause >nul
endlocal
