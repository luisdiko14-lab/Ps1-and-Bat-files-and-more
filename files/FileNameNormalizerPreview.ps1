param([string]$Path='.')
Get-ChildItem -Path $Path -File -ErrorAction SilentlyContinue | Select-Object Name,@{N='Normalized';E={($_.BaseName -replace '[^A-Za-z0-9_-]+','_') + $_.Extension}} | Format-Table -AutoSize
