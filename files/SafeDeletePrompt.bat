@echo off
set TARGET=%~1
if "%TARGET%"=="" (
  echo Usage: %~nx0 ^<file_or_folder^>
  exit /b 1
)
set /p ans=Delete "%TARGET%"? (y/N): 
if /I "%ans%"=="y" (
  del /f /q "%TARGET%" 2>nul
  rd /s /q "%TARGET%" 2>nul
  echo Deleted if target existed.
) else (
  echo Cancelled.
)
