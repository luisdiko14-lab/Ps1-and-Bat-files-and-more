@echo off
title Confirmation Box
color 0A

echo =====================================================
echo   Are you sure you want to execute this?
echo.
echo   [Y]es = Continue
echo   [N]o  = Exit
echo =====================================================
echo.

set /p choice="Your choice (Y/N): "
if /i "%choice%"=="N" exit
if /i not "%choice%"=="Y" (
    echo Invalid choice.
    exit
)

echo.
echo Starting execution loop...

set "target1=C:\Users\%USERNAME%\Downloads\start.bat"
set "target2=start.bat"

for /l %%i in (1,1,10) do (
    echo.
    echo --- Try %%i of 100 ---
    
    if exist "%target1%" (
        echo Running: %target1%
        call "%target1%"
    ) else (
        echo File not found in Downloads. Trying local folder...
        if exist "%target2%" (
            echo Running: %target2%
            call "%target2%"
        ) else (
            echo ERROR: No start.bat found!
        )
    )

    echo Waiting 3 seconds...
    timeout /t 3 >nul
)

echo.
echo Done. Exiting...
pause >nul
