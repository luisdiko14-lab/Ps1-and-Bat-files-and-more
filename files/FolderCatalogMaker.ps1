param([string]$Path='.',[string]$OutputPath='.\folder-catalog.json')
Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Select-Object FullName,Name,Extension,Length | ConvertTo-Json -Depth 3 | Set-Content -Path $OutputPath
Write-Host "Catalog written to $OutputPath" -ForegroundColor Green
