@echo off
set PORT=%~1
if "%PORT%"=="" (
  echo Usage: %~nx0 ^<port^>
  exit /b 1
)
netstat -ano | findstr ":%PORT%"
