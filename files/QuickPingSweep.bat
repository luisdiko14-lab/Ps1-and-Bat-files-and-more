@echo off
setlocal EnableDelayedExpansion
set BASE=%~1
if "%BASE%"=="" set BASE=192.168.1

echo === Quick Ping Sweep (%BASE%.1-%BASE%.10) ===
for /L %%i in (1,1,10) do (
    ping -n 1 -w 200 %BASE%.%%i >nul
    if !errorlevel! == 0 (
        echo [UP]   %BASE%.%%i
    ) else (
        echo [DOWN] %BASE%.%%i
    )
)
endlocal
