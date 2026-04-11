<#
.SYNOPSIS
    Utility Toolkit 031 - Adds and subtracts days from a base date.
.DESCRIPTION
    Pattern: DateMath. This script variant #031 provides a focused admin/data utility.
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
# Variant marker: UTK-031-DateMath
