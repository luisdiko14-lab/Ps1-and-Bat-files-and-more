@echo off
setlocal EnableDelayedExpansion

set "chars=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()"
set "pass="

for /L %%i in (1,1,12) do (
    set /A idx=!random! %% 72
    for %%c in (!idx!) do set "pass=!pass!!chars:~%%c,1!"
)

echo Your password is: !pass!
pause
