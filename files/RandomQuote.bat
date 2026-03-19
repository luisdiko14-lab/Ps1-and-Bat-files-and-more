@echo off
setlocal EnableDelayedExpansion
set /a r=%random% %% 5
if !r!==0 echo "Build cool stuff."
if !r!==1 echo "Small scripts, big impact."
if !r!==2 echo "Automate the boring parts."
if !r!==3 echo "Debugging is detective work."
if !r!==4 echo "Ship, learn, improve."
endlocal
