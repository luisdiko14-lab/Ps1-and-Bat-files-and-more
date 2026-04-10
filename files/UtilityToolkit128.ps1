<#
.SYNOPSIS
    Utility Toolkit 128 - Captures top processes by memory usage.
.DESCRIPTION
    Pattern: ProcessSnapshot. This script variant #128 provides a focused admin/data utility.
#>
[CmdletBinding()]
param([int]$Top = 10)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
Get-Process |
    Sort-Object WorkingSet64 -Descending |
    Select-Object -First $Top Name, Id, @{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64/1MB,2)}}
# Variant marker: UTK-128-ProcessSnapshot
