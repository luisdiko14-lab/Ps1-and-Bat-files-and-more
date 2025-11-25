@echo off
title Dramatic Shutdown Sequence
color 0A

:: Phase 1 - Safe
echo [Phase 1] Checking system integrity...
timeout /t 3 >nul
echo All systems nominal. Everything is safe... for now.
timeout /t 2 >nul
echo Preparing next phase...
timeout /t 2 >nul
echo.

:: Phase 2 - Kinda Not Good
echo [Phase 2] Warning: Minor issues detected.
timeout /t 2 >nul
echo Some programs might close unexpectedly.
timeout /t 2 >nul
echo Monitoring system activity...
timeout /t 3 >nul
echo Uh oh... things are starting to get unstable.
timeout /t 2 >nul
echo.

:: Phase 3 - Not Safe
echo [Phase 3] Critical alert! Forced shutdown imminent.
timeout /t 3 >nul
echo Saving last logs...
timeout /t 2 >nul
echo Closing applications...
timeout /t 2 >nul

:: Shutdown
echo Initiating forced shutdown now!
shutdown -f -t 5
echo Goodbye...
timeout /t 5 >nul
exit
