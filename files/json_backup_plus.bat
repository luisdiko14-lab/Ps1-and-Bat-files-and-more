@echo off
set SRC=%~1
if "%SRC%"=="" ( echo Usage: %~nx0 ^<json-file^> & exit /b 1 )
copy "%SRC%" "%SRC%.bak" >nul
echo JSON backup done.
