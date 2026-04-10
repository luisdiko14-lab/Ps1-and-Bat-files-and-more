<#
.SYNOPSIS
Filters files by extension and age.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Path,
    [string]$Extension = '.log',
    [int]$OlderThanDays = 7
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-EchoBeaconTool {
    $cutoff = (Get-Date).AddDays(-$OlderThanDays)
    Get-ChildItem -Path $Path -File -ErrorAction Stop |
        Where-Object { $_.Extension -eq $Extension -and $_.LastWriteTime -lt $cutoff } |
        Select-Object FullName, Length, LastWriteTime
}

Invoke-EchoBeaconTool
