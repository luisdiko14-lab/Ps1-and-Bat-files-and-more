$paths = @(
    "$env:TEMP",
    "$env:WINDIR\Temp"
)

Write-Host "Cleaning temporary files..." -ForegroundColor Yellow
foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "Removing contents from: $path"
        Get-ChildItem -Path $path -Force -ErrorAction SilentlyContinue |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Cleanup complete." -ForegroundColor Green
