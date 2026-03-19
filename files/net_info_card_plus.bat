@echo off
echo === Network Info Card ===
hostname
ipconfig | findstr /I "IPv4 Gateway DNS"
