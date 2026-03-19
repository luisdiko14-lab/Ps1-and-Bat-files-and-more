Get-SmbShare -ErrorAction SilentlyContinue | Select-Object Name,Path,Description,CurrentUsers | Format-Table -AutoSize
