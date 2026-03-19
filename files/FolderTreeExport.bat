@echo off
set TARGET=%~1
if "%TARGET%"=="" set TARGET=%cd%
set OUT=folder_tree.txt
tree "%TARGET%" /F > "%OUT%"
echo Folder tree exported to %OUT%
