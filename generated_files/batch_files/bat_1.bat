@echo off
set LOG=bat_1.log
echo Script started > %LOG%

echo System Information >> %LOG%
systeminfo >> %LOG%

echo Listing current directory >> %LOG%
dir >> %LOG%

set count=0
:loop
set /a count+=1
echo Processing %%count%% >> %LOG%
if %%count%% LSS 50 goto loop

echo Environment Variables >> %LOG%
set >> %LOG%

echo Script finished >> %LOG%
pause
