@echo off
for /f %%c in ('dir /a /b "%TEMP%" 2^>nul ^| find /c /v ""') do echo TEMP items: %%c
