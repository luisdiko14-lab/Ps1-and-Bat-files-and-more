@echo off
set OUT=%~1
if "%OUT%"=="" set OUT=dir_snapshot.txt
dir /b >"%OUT%"
echo Wrote %OUT%
