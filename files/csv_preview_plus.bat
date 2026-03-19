@echo off
set FILE=%~1
if "%FILE%"=="" ( echo Usage: %~nx0 ^<csv-file^> & exit /b 1 )
more +0 "%FILE%"
