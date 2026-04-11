<#
.SYNOPSIS
    Utility Toolkit 187 - Adds and subtracts days from a base date.
.DESCRIPTION
    Pattern: DateMath. This script variant #187 provides a focused admin/data utility.
#>
[CmdletBinding()]
param(
    [Parameter()]
    [datetime]$BaseDate = (Get-Date),
    [Parameter()]
    [int]$OffsetDays = 7
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
[PSCustomObject]@{
    BaseDate = $BaseDate
    PlusDays = $BaseDate.AddDays($OffsetDays)
    MinusDays = $BaseDate.AddDays(-$OffsetDays)
    OffsetDays = $OffsetDays
}
# Variant marker: UTK-187-DateMath
