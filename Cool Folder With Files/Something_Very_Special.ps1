# Phased PowerShell Creator
Clear-Host
Write-Host "=============================="
Write-Host "       PHASED PS1 CREATOR      "
Write-Host "==============================`n"

do {
    Write-Host "1. Phase 1 - Safe"
    Write-Host "2. Phase 2 - Kinda Not Good"
    Write-Host "3. Phase 3 - Critical"
    Write-Host "4. Exit`n"
    $choice = Read-Host "Choose a phase (1-4)"

    switch ($choice) {
        "1" {
            Write-Host "Creating Phase1.ps1..."
            @"
# Phase 1 - Safe
Write-Host 'You are in Phase 1. Everything is safe.'
Pause
"@ | Out-File -Encoding UTF8 Phase1.ps1
            Write-Host "Phase1.ps1 created successfully!" -ForegroundColor Green
        }
        "2" {
            Write-Host "Creating Phase2.ps1..."
            @"
# Phase 2 - Kinda Not Good
Write-Host 'Warning! Some things might go wrong...'
Pause
"@ | Out-File -Encoding UTF8 Phase2.ps1
            Write-Host "Phase2.ps1 created successfully!" -ForegroundColor Yellow
        }
        "3" {
            Write-Host "Creating Phase3.ps1..."
            @"
# Phase 3 - Critical
Write-Host 'Uh oh! Critical phase. Be ready...'
Pause
"@ | Out-File -Encoding UTF8 Phase3.ps1
            Write-Host "Phase3.ps1 created successfully!" -ForegroundColor Red
        }
        "4" {
            Write-Host "Goodbye!" -ForegroundColor Cyan
            break
        }
        Default {
            Write-Host "Invalid choice! Try again." -ForegroundColor Magenta
        }
    }

    Write-Host "`nPress Enter to return to menu..."
    Read-Host
    Clear-Host
} while ($true)
