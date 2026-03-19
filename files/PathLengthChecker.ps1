param([string]$Path='.',[int]$MinLength=120)
Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName.Length -ge $MinLength } | Select-Object FullName,@{N='Length';E={$_.FullName.Length}} | Format-Table -Wrap
