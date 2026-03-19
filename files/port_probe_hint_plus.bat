@echo off
if "%~1"=="" ( echo Usage: %~nx0 ^<port^> & exit /b 1 )
netstat -ano | findstr /R /C:":%~1 "
