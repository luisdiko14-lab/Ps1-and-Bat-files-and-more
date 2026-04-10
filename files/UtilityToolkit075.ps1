<#
.SYNOPSIS
    Utility Toolkit 075 - Shows CSV column names and first rows.
.DESCRIPTION
    Pattern: CsvPeek. This script variant #075 provides a focused admin/data utility.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$CsvPath,
    [Parameter()]
    [int]$Rows = 5
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if (-not (Test-Path -LiteralPath $CsvPath)) { throw "CSV file not found: $CsvPath" }
$rows = Import-Csv -LiteralPath $CsvPath
if (-not $rows) { Write-Warning 'CSV contains no rows.'; return }
$rows | Select-Object -First $Rows
# Variant marker: UTK-075-CsvPeek
