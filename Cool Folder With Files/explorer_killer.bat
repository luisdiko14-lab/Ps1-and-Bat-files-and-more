echo off
title "Killing Explorer..."
echo Starting Operation
taskkill /IM explorer.exe -f
echo "Done!"
if error=echo "Something Went Wrong"
