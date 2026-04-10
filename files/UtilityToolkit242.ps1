<#
.SYNOPSIS
    Utility Toolkit 242.
.DESCRIPTION
    A reusable PowerShell utility template with strict mode, parameter validation, and clear output.
#>
[CmdletBinding()]
param(
    [Parameter()]
    [string]$Message = "Utility Toolkit 242 is ready.",

    [Parameter()]
    [switch]$AsObject
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$result = [PSCustomObject]@{
    ToolName   = 'Utility Toolkit 242'
    Timestamp  = $timestamp
    Message    = $Message
    Machine    = $env:COMPUTERNAME
    User       = $env:USERNAME
}

if ($AsObject) {
    $result
} else {
    Write-Host "[$($result.Timestamp)] $($result.ToolName): $($result.Message)" -ForegroundColor Cyan
}
