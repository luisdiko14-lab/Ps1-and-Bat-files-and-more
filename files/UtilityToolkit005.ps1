<#
.SYNOPSIS
    Utility Toolkit 005 - Generates hashes for files in a directory.
.DESCRIPTION
    Pattern: FileHashReport. This script variant #005 provides a focused admin/data utility.
#>
[CmdletBinding()]
param(
    [Parameter()]
    [string]$Path='.',
    [Parameter()]
    [ValidateSet('SHA256','SHA1','MD5')]
    [string]$Algorithm='SHA256'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
Get-ChildItem -LiteralPath $Path -File -ErrorAction Stop |
    Get-FileHash -Algorithm $Algorithm |
    Select-Object Path, Algorithm, Hash
# Variant marker: UTK-005-FileHashReport
