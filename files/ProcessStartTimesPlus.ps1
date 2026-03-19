Get-Process | Where-Object {$_.StartTime -ne $null} | Sort-Object StartTime -Descending | Select-Object -First 15 ProcessName,Id,StartTime | Format-Table -AutoSize
