@echo off
setlocal enabledelayedexpansion
for %%e in (.txt .log .ps1 .bat .md .json) do (
  for /f %%c in ('dir /b /s *%%e 2^>nul ^| find /c /v ""') do echo %%e = %%c
)
endlocal
