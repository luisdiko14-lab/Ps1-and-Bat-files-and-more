@echo off
set /a N=%random% %% 6
if %N%==0 echo Suggested color: 0A
if %N%==1 echo Suggested color: 0B
if %N%==2 echo Suggested color: 0C
if %N%==3 echo Suggested color: 0D
if %N%==4 echo Suggested color: 0E
if %N%==5 echo Suggested color: 09
