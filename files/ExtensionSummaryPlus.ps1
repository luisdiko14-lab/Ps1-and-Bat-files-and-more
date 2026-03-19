param([string]$Path='.')
Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Group-Object Extension | Sort-Object Count -Descending | Select-Object Name,Count | Format-Table -AutoSize
