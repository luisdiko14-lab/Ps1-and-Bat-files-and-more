# ==============================
# PowerShell Script 6
# ==============================

$LogFile = "ps1_6.log"

function Write-Log {
    param([string]$Message)
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$time - $Message" | Out-File -Append $LogFile
}

function Get-SystemInfo {
    Write-Log "Collecting system info"
    Get-ComputerInfo | Select-Object OSName, OSVersion, CsName
}

function Scan-Directory {
    param([string]$Path)
    if (Test-Path $Path) {
        Get-ChildItem -Recurse $Path | Measure-Object
    } else {
        Write-Log "Directory not found: $Path"
    }
}

Write-Log "Script started"

$info = Get-SystemInfo
$info | Out-String | Write-Log

$paths = @("C:\Windows", "C:\Users")
foreach ($p in $paths) {
    Write-Log "Scanning $p"
    Scan-Directory $p | Out-String | Write-Log
}

for ($i=1; $i -le 40; $i++) {
    Write-Output "Processing item $i"
    Start-Sleep -Milliseconds 20
}

Write-Log "Script finished"

