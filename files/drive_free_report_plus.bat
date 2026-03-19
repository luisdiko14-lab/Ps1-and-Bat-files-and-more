@echo off
echo === Drive Free Report ===
wmic logicaldisk get Caption,FreeSpace,Size
