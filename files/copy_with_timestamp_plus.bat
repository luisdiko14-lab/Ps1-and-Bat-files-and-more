@echo off
set SRC=%~1
if "%SRC%"=="" ( echo Usage: %~nx0 ^<file^> & exit /b 1 )
copy "%SRC%" "%SRC%.backup" >nul
echo Backup created: %SRC%.backup
