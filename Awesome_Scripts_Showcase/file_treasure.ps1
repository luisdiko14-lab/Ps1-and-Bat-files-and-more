$folder = Join-Path $PSScriptRoot 'Treasure_Hunt'
if (-not (Test-Path $folder)) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}
$files = @('gold.txt','map.txt','clue.txt')
foreach ($file in $files) {
    $path = Join-Path $folder $file
    if (-not (Test-Path $path)) {
        Set-Content -Path $path -Value "This is $file"
    }
}
Write-Host "Treasure files created in $folder" -ForegroundColor Green
