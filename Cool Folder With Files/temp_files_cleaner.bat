@echo off
title System Cleanup Tool
echo Cleaning temporary files...
del /q /s %temp%\* >nul 2>&1
rd /s /q %temp% >nul 2>&1
mkdir %temp%
echo Temp files cleaned!
pause
