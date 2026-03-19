@echo off
if "%~1"=="" ( echo Usage: %~nx0 ^<service-name^> & exit /b 1 )
sc query "%~1"
