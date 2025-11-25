@echo off
title Phased Batch Creator
color 0B

:MENU
cls
echo ==============================
echo       PHASED BATCH CREATOR
echo ==============================
echo.
echo 1. Phase 1 - Safe
echo 2. Phase 2 - Kinda Not Good
echo 3. Phase 3 - Critical
echo 4. Exit
echo.
set /p choice=Choose a phase (1-4): 

if "%choice%"=="1" goto PHASE1
if "%choice%"=="2" goto PHASE2
if "%choice%"=="3" goto PHASE3
if "%choice%"=="4" goto END
echo Invalid choice! Try again.
timeout /t 2 >nul
goto MENU

:PHASE1
echo Creating Phase1.bat...
(
echo @echo off
echo title Phase 1 - Safe
echo echo You are in Phase 1. Everything is safe.
echo pause
) > Phase1.bat
echo Phase1.bat created successfully!
pause
goto MENU

:PHASE2
echo Creating Phase2.bat...
(
echo @echo off
echo title Phase 2 - Kinda Not Good
echo echo Warning! Some things might go wrong...
echo pause
) > Phase2.bat
echo Phase2.bat created successfully!
pause
goto MENU

:PHASE3
echo Creating Phase3.bat...
(
echo @echo off
echo title Phase 3 - Critical
echo echo Uh oh! Critical phase. Be ready...
echo pause
) > Phase3.bat
echo Phase3.bat created successfully!
pause
goto MENU

:END
echo Goodbye!
timeout /t 2 >nul
exit
