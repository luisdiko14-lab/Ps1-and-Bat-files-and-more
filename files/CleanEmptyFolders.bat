@echo off
set TARGET=%~1
if "%TARGET%"=="" set TARGET=%cd%
for /f "delims=" %%d in ('dir "%TARGET%" /ad/b/s ^| sort /R') do rd "%%d" 2>nul
echo Empty folders removed under %TARGET% (if any).
