<#
.SYNOPSIS
Compares two folders and lists missing files.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$LeftPath,
    [Parameter(Mandatory)] [string]$RightPath
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-HyperJournalTool {
    $left = Get-ChildItem -Path $LeftPath -File | Select-Object -ExpandProperty Name
    $right = Get-ChildItem -Path $RightPath -File | Select-Object -ExpandProperty Name
    Compare-Object -ReferenceObject $left -DifferenceObject $right |
      Select-Object InputObject, SideIndicator
}

Invoke-HyperJournalTool
