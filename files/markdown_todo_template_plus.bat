@echo off
set FILE=%~1
if "%FILE%"=="" set FILE=todo-template.md
(
 echo - [ ] First task
 echo - [ ] Second task
 echo - [x] Example done task
)>"%FILE%"
echo Created %FILE%
