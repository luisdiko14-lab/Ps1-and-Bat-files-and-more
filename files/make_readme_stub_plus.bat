@echo off
set FILE=%~1
if "%FILE%"=="" set FILE=README-STUB.md
(
 echo # Cool Project
 echo.
 echo Short project description here.
)>"%FILE%"
echo Created %FILE%
