<#
.SYNOPSIS
Reads environment variables matching a pattern.
#>
[CmdletBinding()]
param([string]$Pattern = 'PATH|TEMP')
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-BoldGuardTool {
    Get-ChildItem Env: |
      Where-Object { $_.Name -match $Pattern } |
      Sort-Object Name |
      Select-Object Name, Value
}

Invoke-BoldGuardTool
