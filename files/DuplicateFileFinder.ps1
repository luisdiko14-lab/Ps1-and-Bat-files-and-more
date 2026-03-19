param([Parameter(Mandatory=$true)][string]$Path)
Get-ChildItem -Path $Path -Recurse -File |
    Group-Object Length |
    Where-Object { $_.Count -gt 1 } |
    ForEach-Object { $_.Group | Get-FileHash -Algorithm SHA256 } |
    Group-Object Hash |
    Where-Object { $_.Count -gt 1 } |
    Select-Object -ExpandProperty Group |
    Format-Table Path, Hash -AutoSize
