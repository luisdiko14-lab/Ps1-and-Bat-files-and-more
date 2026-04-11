<#
.SYNOPSIS
Shows top processes by working set memory.
#>
[CmdletBinding()]
param([int]$Top = 10)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-XenoFilterTool {
    Get-Process |
      Sort-Object WorkingSet64 -Descending |
      Select-Object -First $Top Name, Id, CPU, @{n='MemoryMB';e={ [math]::Round($_.WorkingSet64/1MB,2) }}
}

Invoke-XenoFilterTool
