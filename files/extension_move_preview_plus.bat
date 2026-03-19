@echo off
for %%f in (*) do if not "%%~xf"=="" echo move "%%f" "%%~xf\"
