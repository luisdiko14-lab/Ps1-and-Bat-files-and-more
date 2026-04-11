<#
.SYNOPSIS
    Utility Toolkit 105 - Reads recent Windows event log entries.
.DESCRIPTION
    Pattern: EventLogRecent. This script variant #105 provides a focused admin/data utility.
#>
[CmdletBinding()]
param(
    [Parameter()]
    [string]$LogName='System',
    [Parameter()]
    [int]$Newest = 20
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
Get-EventLog -LogName $LogName -Newest $Newest |
    Select-Object TimeGenerated, EntryType, Source, EventID, Message
# Variant marker: UTK-105-EventLogRecent
