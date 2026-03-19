@echo off
where git >nul 2>&1
if errorlevel 1 ( echo git not found & exit /b 1 )
git branch --show-current
