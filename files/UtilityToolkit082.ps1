<#
.SYNOPSIS
    Utility Toolkit 082 - Creates a batch of GUID values.
.DESCRIPTION
    Pattern: GuidBatch. This script variant #082 provides a focused admin/data utility.
#>
[CmdletBinding()]
param([int]$Count = 5)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
1..$Count | ForEach-Object {
    [PSCustomObject]@{ Index=$_; Guid=[guid]::NewGuid().Guid }
}
# Variant marker: UTK-082-GuidBatch
