@echo off
:menu
echo 1. Say hi
echo 2. Show date
echo 3. Exit
set /p C=Choice: 
if "%C%"=="1" echo Hi from the cool menu!
if "%C%"=="2" echo %date% %time%
if "%C%"=="3" exit /b
goto menu
