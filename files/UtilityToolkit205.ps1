<#
.SYNOPSIS
    Utility Toolkit 205 - Builds a folder size summary report.
.DESCRIPTION
    Pattern: FolderSizeReport. This script variant #205 provides a focused admin/data utility.
#>
[CmdletBinding()]
param(
    [Parameter()]
    [string]$Path = '.',
    [Parameter()]
    [int]$Top = 10
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if (-not (Test-Path -LiteralPath $Path)) { throw "Path not found: $Path" }
Get-ChildItem -LiteralPath $Path -Directory -ErrorAction Stop |
    ForEach-Object {
        $size = (Get-ChildItem -LiteralPath $_.FullName -File -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        [PSCustomObject]@{ Directory=$_.Name; SizeMB=[math]::Round(($size/1MB),2) }
    } |
    Sort-Object SizeMB -Descending |
    Select-Object -First $Top
# Variant marker: UTK-205-FolderSizeReport
