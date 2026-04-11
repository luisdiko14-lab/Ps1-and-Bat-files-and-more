<#
.SYNOPSIS
    Utility Toolkit 106 - Creates a batch of GUID values.
.DESCRIPTION
    Pattern: GuidBatch. This script variant #106 provides a focused admin/data utility.
#>
[CmdletBinding()]
param([int]$Count = 5)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
1..$Count | ForEach-Object {
    [PSCustomObject]@{ Index=$_; Guid=[guid]::NewGuid().Guid }
}
# Variant marker: UTK-106-GuidBatch
