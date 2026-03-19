@echo off
if "%~2"=="" ( echo Usage: %~nx0 ^<a^> ^<b^> & exit /b 1 )
if "%~1"=="%~2" (echo SAME) else echo DIFFERENT
