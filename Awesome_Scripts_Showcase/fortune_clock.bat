@echo off
setlocal EnableExtensions
set /a random_number=%RANDOM% %% 4

echo Here is your little fortune:
echo.
if %random_number%==0 (
    echo You are about to have a great day!
) else if %random_number%==1 (
    echo Keep going. Small wins still count.
) else if %random_number%==2 (
    echo Your ideas are getting stronger.
) else (
    echo A spark of creativity is coming your way.
)
echo.
echo Press any key to exit...
pause >nul
endlocal
