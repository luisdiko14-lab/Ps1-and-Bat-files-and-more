param([string]$Path='.')
Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Where-Object Length -eq 0 | Select-Object FullName,LastWriteTime | Format-Table -AutoSize
