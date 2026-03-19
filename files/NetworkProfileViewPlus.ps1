Get-NetConnectionProfile -ErrorAction SilentlyContinue | Select-Object Name,InterfaceAlias,NetworkCategory,IPv4Connectivity | Format-Table -AutoSize
