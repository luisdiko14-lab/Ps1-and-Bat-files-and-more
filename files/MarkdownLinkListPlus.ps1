param([Parameter(Mandatory=$true)][string]$Path)
Select-String -Path $Path -Pattern '\[[^\]]+\]\(([^)]+)\)' | ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value }
