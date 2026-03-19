@echo off
echo === CPU Information ===
wmic cpu get Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed
