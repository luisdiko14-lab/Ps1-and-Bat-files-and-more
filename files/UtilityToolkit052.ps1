<#
.SYNOPSIS
    Utility Toolkit 052 - Finds lines containing a keyword with line numbers.
.DESCRIPTION
    Pattern: TextSearch. This script variant #052 provides a focused admin/data utility.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$FilePath,
    [Parameter(Mandatory)]
    [string]$Keyword
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if (-not (Test-Path -LiteralPath $FilePath)) { throw "File not found: $FilePath" }
Select-String -LiteralPath $FilePath -Pattern $Keyword |
    Select-Object LineNumber, Line
# Variant marker: UTK-052-TextSearch
