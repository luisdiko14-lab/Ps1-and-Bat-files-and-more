<#
.SYNOPSIS
Creates a timestamped backup copy of a file.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Path,
    [string]$DestinationDir = "$env:TEMP"
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-AdaptiveEngineTool {
    $source = Resolve-Path -Path $Path -ErrorAction Stop
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $dest = Join-Path $DestinationDir ((Split-Path $source -Leaf) + ".$stamp.bak")
    Copy-Item -Path $source -Destination $dest -Force
    [pscustomobject]@{ Source = $source.Path; Backup = $dest; CreatedAt = Get-Date }
}

Invoke-AdaptiveEngineTool
