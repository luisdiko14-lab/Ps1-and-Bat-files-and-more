# Displays useful system info
Clear-Host
Write-Host "===== SYSTEM INFO DASHBOARD =====" -ForegroundColor Yellow
Write-Host "Computer Name: $env:COMPUTERNAME"
Write-Host "User Name: $env:USERNAME"
Write-Host "OS Version: " (Get-CimInstance Win32_OperatingSystem).Caption
Write-Host "CPU: " (Get-CimInstance Win32_Processor).Name
Write-Host "RAM: " "{0:N2}" -f ((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB) "GB"
Write-Host "Free Disk Space (C:): " "{0:N2}" -f ((Get-PSDrive C).Free/1GB) "GB"
Write-Host "===============================" -ForegroundColor Yellow
pause
