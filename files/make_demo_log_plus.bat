@echo off
set FILE=%~1
if "%FILE%"=="" set FILE=demo.log
(
  echo [%date% %time%] Demo log started
  echo [%date% %time%] Everything looks cool
)>"%FILE%"
echo Wrote %FILE%
