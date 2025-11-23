@echo off
setlocal enabledelayedexpansion
set chars=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()
set pass=
for /l %%i in (1,1,12) do (
    set /a index=!random! %% 72
    set pass=!pass!!chars:~%index%,1!
)
echo Generated Password: %pass%
pause
