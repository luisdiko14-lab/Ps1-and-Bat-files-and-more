@echo off
if "%~1"=="" ( echo Usage: %~nx0 ^<file^> & exit /b 1 )
if exist "%~1" (echo FOUND) else echo MISSING
