<#
.SYNOPSIS
    Utility Toolkit 042 - Tests one or more TCP ports on a host.
.DESCRIPTION
    Pattern: QuickPortTest. This script variant #042 provides a focused admin/data utility.
#>
[CmdletBinding()]
param(
    [Parameter()]
    [string]$ComputerName='localhost',
    [Parameter()]
    [int[]]$Port= @(80,443)
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
foreach ($p in $Port) {
    $r = Test-NetConnection -ComputerName $ComputerName -Port $p -WarningAction SilentlyContinue
    [PSCustomObject]@{ Computer=$ComputerName; Port=$p; Reachable=$r.TcpTestSucceeded }
}
# Variant marker: UTK-042-QuickPortTest
