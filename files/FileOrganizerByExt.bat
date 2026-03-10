@echo off
setlocal
set TARGET=%~1
if "%TARGET%"=="" set TARGET=%cd%

echo Organizing files in "%TARGET%" by extension...
for %%f in ("%TARGET%\*") do (
    if not "%%~xf"=="" (
        if not exist "%TARGET%\%%~xf" mkdir "%TARGET%\%%~xf" >nul 2>&1
        move "%%f" "%TARGET%\%%~xf\" >nul 2>&1
    )
)
echo Done.
endlocal
