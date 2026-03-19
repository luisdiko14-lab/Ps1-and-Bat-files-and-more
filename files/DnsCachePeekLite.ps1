Get-DnsClientCache -ErrorAction SilentlyContinue | Select-Object -First 20 Entry,Name,Type,Status | Format-Table -AutoSize
