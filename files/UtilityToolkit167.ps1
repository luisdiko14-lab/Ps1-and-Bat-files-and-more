<#
.SYNOPSIS
    Utility Toolkit 167 - Summarizes key environment variables.
.DESCRIPTION
    Pattern: EnvSummary. This script variant #167 provides a focused admin/data utility.
#>
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$keys = 'COMPUTERNAME','USERNAME','USERDOMAIN','OS','PROCESSOR_ARCHITECTURE','TEMP','PATH'
foreach ($k in $keys) {
    [PSCustomObject]@{ Name=$k; Value=[Environment]::GetEnvironmentVariable($k) }
}
# Variant marker: UTK-167-EnvSummary
