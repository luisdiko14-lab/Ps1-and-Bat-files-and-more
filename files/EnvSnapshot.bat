@echo off
set OUT=env_snapshot_%date:~-4%%date:~4,2%%date:~7,2%.txt
set > "%OUT%"
echo Environment variables saved to %OUT%
