@echo off
for /f "tokens=2 delims==" %%a in ('wmic os get lastbootuptime /value ^| find "="') do set LBT=%%a
echo Last Boot (raw): %LBT%
