@echo off
set SRC=%~1
set DST=%~2
if "%SRC%"=="" goto :usage
if "%DST%"=="" goto :usage

robocopy "%SRC%" "%DST%" /MIR /R:1 /W:1
echo Backup mirror completed.
goto :eof

:usage
echo Usage: %~nx0 ^<source_folder^> ^<destination_folder^>
