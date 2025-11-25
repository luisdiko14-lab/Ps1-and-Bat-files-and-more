@echo off
title MATRIX CONSOLE SIMULATION
color 0a
mode 100,30

:: ========================================
:: BOOT
:: ========================================
cls
echo Initializing MATRIX Console...
ping localhost -n 2 >nul

for /l %%a in (1,1,20) do (
    echo Loading core system %%a/20
    ping localhost -n 1 >nul
)

:: ========================================
:: LOGIN
:: ========================================
:login
cls
echo ================================
echo       MATRIX LOGIN GATE
echo ================================
echo.
set /p pass=ENTER ACCESS PASSWORD: 

if "%pass%"=="zion" goto menu
echo ACCESS DENIED.
ping localhost -n 2 >nul
goto login


:: ========================================
:: MENU
:: ========================================
:menu
cls
echo ================================
echo        MATRIX MAIN CONSOLE
echo ================================
echo.
echo 1 - Start Matrix Stream
echo 2 - System Cracking Simulation
echo 3 - Terminal
echo 4 - Virus Upload (fake)
echo 5 - Exit
echo.
set /p m=Select ^> 

if "%m%"=="1" goto stream
if "%m%"=="2" goto crack
if "%m%"=="3" goto term
if "%m%"=="4" goto virus
if "%m%"=="5" exit
goto menu


:: ========================================
:: MATRIX STREAM
:: ========================================
:stream
cls
echo ======================================
echo   MATRIX DATA STREAM (CTRL+C to stop)
echo ======================================
echo.

:stream_loop
set chars=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@$%#&?!
set /a len=%random% %% 50 + 20
set line=

for /l %%i in (1,1,%len%) do (
    set /a r=%random%%%36
    call set "line=%%line!chars:~%random%%%36,1!%%"
)

echo %line%
goto stream_loop


:: ========================================
:: SYSTEM CRACKING SIMULATOR
:: ========================================
:crack
cls
echo Accessing secure mainframe...
ping localhost -n 2 >nul

for /l %%a in (1,1,60) do (
    echo Attempt %%a: Bypassing firewall...
    ping localhost -n 1 >nul
)

echo Firewall bypassed.
ping localhost -n 2 >nul

for /l %%b in (1,1,80) do (
    echo Injecting exploit packet %%b...
    ping localhost -n 1 >nul
)

echo.
echo SYSTEM OVERRIDE COMPLETE.
pause
goto menu


:: ========================================
:: TERMINAL
:: ========================================
:term
cls
echo ==========================
echo      MATRIX TERMINAL
echo ==========================
echo Type HELP for commands.
echo Type EXIT to return.
echo.

:term_loop
set /p cmd=MATRIX:\> 

if /i "%cmd%"=="exit" goto menu

if /i "%cmd%"=="help" (
    echo.
    echo help      - command list
    echo date      - system date
    echo time      - system time
    echo scan      - run fake scan
    echo glitch    - glitch effect
    echo exit      - return
    echo.
    goto term_loop
)

if /i "%cmd%"=="date" (
    echo Current date: %date%
    goto term_loop
)

if /i "%cmd%"=="time" (
    echo Current time: %time%
    goto term_loop
)

if /i "%cmd%"=="scan" (
    echo Running network scan...
    for /l %%a in (1,1,30) do (
        echo Packet %%a received.
        ping localhost -n 1 >nul
    )
    goto term_loop
)

if /i "%cmd%"=="glitch" goto glitch

echo Unknown command: %cmd%
goto term_loop


:: ========================================
:: GLITCH EFFECT
:: ========================================
:glitch
for /l %%z in (1,1,30) do (
    color 0c
    ping localhost -n 1 >nul
    color 0a
    ping localhost -n 1 >nul
)
echo Glitch routine ended.
goto term_loop


:: ========================================
:: FAKE VIRUS UPLOAD
:: ========================================
:virus
cls
echo Uploading virus payload to servers...
ping localhost -n 2 >nul

for /l %%v in (1,1,50) do (
    echo Sending data packet %%v...
    ping localhost -n 1 >nul
)

echo.
echo SYSTEM INFECTED.
ping localhost -n 2 >nul
echo.
echo Just kidding. :)
pause
goto menu
