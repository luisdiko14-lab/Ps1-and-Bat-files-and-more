@echo off
echo === Memory Information ===
wmic OS get FreePhysicalMemory,TotalVisibleMemorySize
