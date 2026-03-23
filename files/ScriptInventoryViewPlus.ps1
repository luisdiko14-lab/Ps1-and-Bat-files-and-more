param([string]$Path='.')
Get-ChildItem -Path $Path -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in '.ps1','.bat','.cmd','.py','.md','.txt','.json' } | Select-Object Name,Extension,Length | Sort-Object Extension,Name | Format-Table -AutoSize
