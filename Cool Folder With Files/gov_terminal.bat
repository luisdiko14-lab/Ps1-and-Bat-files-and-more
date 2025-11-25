@echo off
title █ U.S. BLACK-SITE TERMINAL █
color 0a
mode 100,30

:: =================================
:: BOOT SEQUENCE
:: =================================
cls
echo Initializing Secure Terminal...
ping localhost -n 2 >nul

for /l %%a in (1,1,25) do (
    echo Loading classified module %%a...
    ping localhost -n 1 >nul
)

echo Connecting to Homeland Security Node...
ping localhost -n 2 >nul

:: =================================
:: ACCESS CODE LOGIN
:: =================================
set code=ALPHA-7
:login
cls
echo =============================================
echo        █ CLASSIFIED ACCESS REQUIRED █
echo =============================================
echo.
set /p access=ENTER ACCESS CODE: 

if "%access%"=="%code%" goto clearance
echo ACCESS DENIED.
ping localhost -n 2 >nul
goto login


:: =================================
:: SECURITY CLEARANCE SCAN
:: =================================
:clearance
cls
echo Performing biometric and clearance validation...
ping localhost -n 2 >nul

for /l %%a in (1,1,50) do (
    echo Security Scan Level %%a...
    ping localhost -n 1 >nul
)

echo Clearance Accepted.
ping localhost -n 1 >nul
goto menu


:: =================================
:: MAIN MENU
:: =================================
:menu
cls
echo ==================================================
echo       █ NATIONAL SECURITY OPERATIONS SYSTEM █
echo ==================================================
echo  1 - Surveillance Cameras (Simulated)
echo  2 - Satellite Control
echo  3 - Access Classified Files
echo  4 - Command Console
echo  5 - Shutdown Terminal
echo.
set /p menu=Select an option ^> 

if "%menu%"=="1" goto cams
if "%menu%"=="2" goto sat
if "%menu%"=="3" goto files
if "%menu%"=="4" goto console
if "%menu%"=="5" exit
goto menu


:: =================================
:: SURVEILLANCE MODE
:: =================================
:cams
cls
echo ===============================
echo     LIVE FEED ACCESS POINTS
echo ===============================
echo Press CTRL+C to exit.
echo.
:cam_loop
set /a feed=%random% %% 8 + 1
set /a id=%random% %% 9999
echo [FEED %feed%] Tracking Subject #%id%
ping localhost -n 1 >nul
goto cam_loop


:: =================================
:: SATELLITE CONTROL
:: =================================
:sat
cls
echo ========================================
echo       SATELLITE ORBIT COMMAND CENTER
echo ========================================
echo.
echo 1 - Track World Position
echo 2 - Run Signal Scan
echo 3 - Return
echo.
set /p s=Choose ^> 

if "%s%"=="1" goto orb
if "%s%"=="2" goto sig
goto menu


:orb
cls
echo Determining global position...
ping localhost -n 2 >nul

for /l %%a in (1,1,60) do (
    echo Tracking coordinate packet %%a
    ping localhost -n 1 >nul
)

echo.
echo Satellites locked on all sectors.
pause
goto sat


:sig
cls
echo Running encrypted frequency scan...
ping localhost -n 2 >nul

for /l %%a in (1,1,40) do (
    echo Analyzing frequency band %%a...
    ping localhost -n 1 >nul
)

echo.
echo Intelligence signal detected: NONE
pause
goto sat


:: =================================
:: CLASSIFIED FILE DATABASE
:: =================================
:files
cls
echo ACCESSING CLASSIFIED DATABASE...
ping localhost -n 2 >nul

for /l %%a in (1,1,30) do (
    echo Decrypting data block %%a...
    ping localhost -n 1 >nul
)

cls
echo ==============================
echo      CLASSIFIED FILE LIST
echo ==============================
echo  - PROJECT NIGHTFALL
echo  - SIGNAL ECHO
echo  - OPERATION IRON WING
echo  - NEXUS UNKNOWN
echo  - ██████████████████
echo.
echo All files heavily redacted.
pause
goto menu


:: =================================
:: COMMAND CONSOLE
:: =================================
:console
cls
echo ==============================
echo    NATIONAL COMMAND SHELL
echo ==============================
echo Type HELP for commands.
echo.

:cmd_loop
set /p cmd=COMMAND:\> 

if /i "%cmd%"=="exit" goto menu

if /i "%cmd%"=="help" (
    echo.
    echo help   - Show commands
    echo date   - System date
    echo time   - System time
    echo trace  - Run target trace
    echo audit  - Perform system audit
    echo exit   - Back to menu
    echo.
    goto cmd_loop
)

if /i "%cmd%"=="date" (
    echo Current date: %date%
    goto cmd_loop
)

if /i "%cmd%"=="time" (
    echo Current time: %time%
    goto cmd_loop
)

if /i "%cmd%"=="trace" (
    echo Running trace protocol...
    for /l %%a in (1,1,25) do (
        echo Tracing node %%a...
        ping localhost -n 1 >nul
    )
    echo SIGNAL LOST.
    goto cmd_loop
)

if /i "%cmd%"=="audit" (
    echo Running system security audit...
    for /l %%a in (1,1,30) do (
        echo Checking subsystem %%a...
        ping localhost -n 1 >nul
    )
    echo System secure.
    goto cmd_loop
)

echo Unknown command: %cmd%
goto cmd_loop
