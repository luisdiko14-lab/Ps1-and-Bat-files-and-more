<#
.SYNOPSIS
    Utility Toolkit 146 - Validates a JSON document and returns root properties.
.DESCRIPTION
    Pattern: JsonLint. This script variant #146 provides a focused admin/data utility.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$JsonPath
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if (-not (Test-Path -LiteralPath $JsonPath)) { throw "JSON file not found: $JsonPath" }
$data = Get-Content -LiteralPath $JsonPath -Raw | ConvertFrom-Json
$data.PSObject.Properties | Select-Object Name, MemberType
# Variant marker: UTK-146-JsonLint
