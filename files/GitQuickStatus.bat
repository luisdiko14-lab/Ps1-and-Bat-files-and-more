@echo off
where git >nul 2>&1
if errorlevel 1 (
  echo Git is not installed or not in PATH.
  exit /b 1
)
git status --short
git branch --show-current
