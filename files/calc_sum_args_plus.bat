@echo off
if "%~2"=="" ( echo Usage: %~nx0 ^<a^> ^<b^> & exit /b 1 )
set /a SUM=%~1+%~2
echo Sum=%SUM%
