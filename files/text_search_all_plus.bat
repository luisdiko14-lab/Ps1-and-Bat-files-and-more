@echo off
if "%~1"=="" ( echo Usage: %~nx0 ^<pattern^> & exit /b 1 )
findstr /S /N /I /P "%~1" *
