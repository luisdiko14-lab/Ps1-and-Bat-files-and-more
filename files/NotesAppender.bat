@echo off
set FILE=quick_notes.txt
set /p NOTE=Enter note: 
echo [%date% %time%] %NOTE%>>"%FILE%"
echo Added to %FILE%
