<#
.SYNOPSIS
    Utility Toolkit 059 - Summarizes key environment variables.
.DESCRIPTION
    Pattern: EnvSummary. This script variant #059 provides a focused admin/data utility.
#>
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$keys = 'COMPUTERNAME','USERNAME','USERDOMAIN','OS','PROCESSOR_ARCHITECTURE','TEMP','PATH'
foreach ($k in $keys) {
    [PSCustomObject]@{ Name=$k; Value=[Environment]::GetEnvironmentVariable($k) }
}
# Variant marker: UTK-059-EnvSummary
