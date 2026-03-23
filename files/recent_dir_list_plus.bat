@echo off
set TARGET=%~1
if "%TARGET%"=="" set TARGET=%cd%
dir "%TARGET%" /o-d
