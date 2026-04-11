<#
.SYNOPSIS
    Utility Toolkit 036 - Counts words, lines, and characters in a file.
.DESCRIPTION
    Pattern: WordCount. This script variant #036 provides a focused admin/data utility.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$FilePath
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$content = Get-Content -LiteralPath $FilePath -Raw
$words = ([regex]::Matches($content, '\\S+')).Count
[PSCustomObject]@{
    FilePath = $FilePath
    Lines = (Get-Content -LiteralPath $FilePath).Count
    Words = $words
    Characters = $content.Length
}
# Variant marker: UTK-036-WordCount
