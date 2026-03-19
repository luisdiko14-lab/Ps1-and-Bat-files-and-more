@echo off
systeminfo | findstr /B /C:"Host Name" /C:"OS Name" /C:"OS Version"
