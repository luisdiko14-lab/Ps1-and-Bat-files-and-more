@echo off
set FILE=%~1
if "%FILE%"=="" (
  echo Usage: %~nx0 ^<file^>
  exit /b 1
)
certutil -hashfile "%FILE%" SHA256
