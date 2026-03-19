@echo off
set HOST=%~1
if "%HOST%"=="" set HOST=1.1.1.1
ipconfig | findstr /I "IPv4"
ping -n 2 %HOST%
