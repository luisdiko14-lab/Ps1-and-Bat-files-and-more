@echo off
set FILE=todo.txt
:menu
echo 1. Add task
echo 2. Show tasks
echo 3. Exit
set /p c=Choice: 
if "%c%"=="1" (
  set /p t=Task: 
  echo [ ] %t%>>"%FILE%"
)
if "%c%"=="2" type "%FILE%"
if "%c%"=="3" exit /b
goto menu
