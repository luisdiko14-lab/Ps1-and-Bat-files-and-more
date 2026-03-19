param([int]$Top=10)
Get-Process | Sort-Object CPU -Descending | Select-Object -First $Top ProcessName,Id,CPU | Format-Table -AutoSize
