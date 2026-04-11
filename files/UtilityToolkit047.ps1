<#
.SYNOPSIS
    Utility Toolkit 047 - Summarizes key environment variables.
.DESCRIPTION
    Pattern: EnvSummary. This script variant #047 provides a focused admin/data utility.
#>
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$keys = 'COMPUTERNAME','USERNAME','USERDOMAIN','OS','PROCESSOR_ARCHITECTURE','TEMP','PATH'
foreach ($k in $keys) {
    [PSCustomObject]@{ Name=$k; Value=[Environment]::GetEnvironmentVariable($k) }
}
# Variant marker: UTK-047-EnvSummary
