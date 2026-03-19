@echo off
for /L %%i in (1,1,5) do (
  cls
  echo === Cool Clock Display ===
  echo Date: %date%
  echo Time: %time%
  timeout /t 1 >nul
)
