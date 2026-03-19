if (Get-Command Get-Clipboard -ErrorAction SilentlyContinue) {
    Get-Clipboard -Raw | Set-Content -Path .\clipboard_snapshot.txt
    Write-Host "Clipboard saved to clipboard_snapshot.txt"
} else {
    Write-Warning "Get-Clipboard command unavailable."
}
