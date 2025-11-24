@echo off
title Luis Toolkit - Colorful Progress Bar
color 0a

:: Ask for folder name
set /p folderName=Enter the folder name to create: 

:: Create folder
mkdir "%folderName%"
echo Folder "%folderName%" created.

:: Create log file
set logFile=%folderName%\Log.txt
echo Log started > "%logFile%"

:: Simulate a colorful progress bar
set "progress="
for /L %%i in (1,1,50) do (
    set /a percent=%%i*2
    set progress=!progress!#
    cls
    echo Creating files...
    echo [%progress%] !percent!%%
    timeout /t 1 >nul
)

echo Done!
echo Log complete >> "%logFile%"
echo Folder and log created successfully!
pause
