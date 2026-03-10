@echo off
set /p SEC=Enter countdown seconds: 
:loop
if %SEC% LEQ 0 goto done
echo Remaining: %SEC%s
set /a SEC-=1
timeout /t 1 >nul
goto loop
:done
echo Time is up!
