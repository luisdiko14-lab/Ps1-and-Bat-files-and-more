param([Parameter(Mandatory=$true)][string]$Path)
Get-Content -Raw $Path | ConvertFrom-Json | ConvertTo-Json -Depth 10
