param(
    [int]$Top = 10
)

if ($Top -lt 1) {
    throw "Top must be at least 1."
}

Write-Host "=== Top $Top Processes by Memory ===" -ForegroundColor Cyan
Get-Process |
    Sort-Object WorkingSet64 -Descending |
    Select-Object -First $Top ProcessName, Id,
        @{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64 / 1MB, 2)}},
        CPU |
    Format-Table -AutoSize
