@echo off
echo === Disk Usage Summary ===
wmic logicaldisk get caption,freespace,size
