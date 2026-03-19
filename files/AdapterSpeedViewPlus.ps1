Get-NetAdapter -ErrorAction SilentlyContinue | Select-Object Name,Status,LinkSpeed,MacAddress | Format-Table -AutoSize
