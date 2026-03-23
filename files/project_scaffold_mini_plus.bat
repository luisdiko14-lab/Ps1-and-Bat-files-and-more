@echo off
set NAME=%~1
if "%NAME%"=="" set NAME=CoolProject
mkdir "%NAME%\src" 2>nul
mkdir "%NAME%\docs" 2>nul
mkdir "%NAME%\tests" 2>nul
echo Scaffold created for %NAME%
