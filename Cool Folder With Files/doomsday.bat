@echo off
title GLOBAL STRIKE NETWORK
color 0c
mode 100,30

cls
echo Connecting to World Military Grid...
ping localhost -n 3 >nul

echo Loading nuclear silos...
for /l %%a in (1,1,40) do (
    echo Initializing silo %%a...
    ping localhost -n 1 >nul
)

set pass=OMEGA
cls
echo ================================
echo        NUCLEAR ARM GATE
echo ================================
set /p code=Enter Launch Authorization Code: 
if not "%code%"=="%pass%" goto fail

cls
echo Authorization accepted.
echo Preparing launch keys...
ping localhost -n 2 >nul

:menu
cls
echo =============================
echo       GLOBAL STRIKE MENU
echo =============================
echo 1 - Arm Warheads
echo 2 - Target Selection
echo 3 - Launch Sequence
echo 4 - Abort
set /p choose=Select: 

if "%choose%"=="1" goto arm
if "%choose%"=="2" goto target
if "%choose%"=="3" goto launch
if "%choose%"=="4" exit
goto menu

:arm
cls
echo Arming warheads...
for /l %%i in (1,1,30) do (
    echo Activating weapon system %%i
    ping localhost -n 1 >nul
)
echo Warheads armed.
pause
goto menu

:target
cls
echo Select Target Zone:
echo 1 - Eastern Hemisphere
echo 2 - Western Hemisphere
echo 3 - Random
set /p tg=Choose: 
echo Target locked.
pause
goto menu

:launch
cls
echo Final launch sequence initiated...
for /l %%i in (10,-1,1) do (
    echo Launching in %%i...
    ping localhost -n 1 >nul
)
echo ** MISSILE LAUNCH SUCCESSFUL **
echo World destroyed.
pause
exit

:fail
echo WRONG CODE — ACCESS DENIED
ping localhost -n 3 >nul
exit
