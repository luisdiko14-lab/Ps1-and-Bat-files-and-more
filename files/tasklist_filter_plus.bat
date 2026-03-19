@echo off
if "%~1"=="" ( echo Usage: %~nx0 ^<name-part^> & exit /b 1 )
tasklist | findstr /I "%~1"
