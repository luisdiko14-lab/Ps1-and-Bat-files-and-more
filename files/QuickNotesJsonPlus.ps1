param([Parameter(Mandatory=$true)][string]$Text,[string]$Path='.\notes.jsonl')
[PSCustomObject]@{Time=(Get-Date);Text=$Text} | ConvertTo-Json -Compress | Add-Content -Path $Path
Write-Host "Saved note to $Path" -ForegroundColor Green
