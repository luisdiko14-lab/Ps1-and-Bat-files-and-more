@echo off
:: CI-SAFE: --ci exits before prompting or creating folders.
setlocal
if /I "%~1"=="--ci" goto :ci
title Project Starter
echo.
echo === Project Starter ===
set /p "PROJECT=Enter a new project folder name: "
if not defined PROJECT (
    echo ERROR: A project name is required.
    exit /b 1
)
if exist "%PROJECT%" (
    echo ERROR: That folder already exists. Nothing was changed.
    exit /b 1
)
mkdir "%PROJECT%\src" "%PROJECT%\tests" "%PROJECT%\docs"
if errorlevel 1 (
    echo ERROR: Could not create the project folders.
    exit /b 1
)
> "%PROJECT%\README.md" echo # New Project
> "%PROJECT%\.gitignore" echo .env
>> "%PROJECT%\.gitignore" echo .venv/
>> "%PROJECT%\.gitignore" echo __pycache__/
echo Project scaffold created in "%CD%\%PROJECT%".
exit /b 0
:ci
echo CI-SAFE: ProjectStarter passed; no folders created.
exit /b 0
