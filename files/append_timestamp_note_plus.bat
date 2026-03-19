@echo off
set /p NOTE=Type note: 
echo [%date% %time%] %NOTE%>>notes.txt
echo Note saved.
