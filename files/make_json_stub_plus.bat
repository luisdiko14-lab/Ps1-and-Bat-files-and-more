@echo off
set FILE=%~1
if "%FILE%"=="" set FILE=stub.json
echo {"name":"cool-tool","enabled":true}>"%FILE%"
echo Created %FILE%
