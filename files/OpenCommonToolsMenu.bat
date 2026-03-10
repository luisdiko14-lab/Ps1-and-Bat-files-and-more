@echo off
:menu
cls
echo === Common Tools Menu ===
echo 1. Notepad
echo 2. Calculator
echo 3. Task Manager
echo 4. Command Prompt
echo 5. Exit
set /p c=Choose: 
if "%c%"=="1" start notepad
if "%c%"=="2" start calc
if "%c%"=="3" start taskmgr
if "%c%"=="4" start cmd
if "%c%"=="5" exit /b
goto menu
