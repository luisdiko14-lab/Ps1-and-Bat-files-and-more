<#
.SYNOPSIS
    Utility Toolkit 178 - Creates a batch of GUID values.
.DESCRIPTION
    Pattern: GuidBatch. This script variant #178 provides a focused admin/data utility.
#>
[CmdletBinding()]
param([int]$Count = 5)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
1..$Count | ForEach-Object {
    [PSCustomObject]@{ Index=$_; Guid=[guid]::NewGuid().Guid }
}
# Variant marker: UTK-178-GuidBatch
