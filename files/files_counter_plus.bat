@echo off
for /f %%c in ('dir /a-d /s /b 2^>nul ^| find /c /v ""') do echo Files: %%c
