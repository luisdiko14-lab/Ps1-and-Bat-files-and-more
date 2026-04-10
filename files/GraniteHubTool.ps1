<#
.SYNOPSIS
Creates a checksum manifest for files in a folder.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$Path,
    [string]$Algorithm = 'SHA256'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-GraniteHubTool {
    Get-ChildItem -Path $Path -File -Recurse |
      Get-FileHash -Algorithm $Algorithm |
      Select-Object Path, Algorithm, Hash
}

Invoke-GraniteHubTool
