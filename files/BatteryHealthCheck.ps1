$battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
if (-not $battery) {
    Write-Host "No battery detected (likely desktop)." -ForegroundColor Yellow
    return
}
$battery | Select-Object Name, EstimatedChargeRemaining, BatteryStatus | Format-Table -AutoSize
