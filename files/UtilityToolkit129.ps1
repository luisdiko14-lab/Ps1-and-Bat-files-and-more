<#
.SYNOPSIS
    Utility Toolkit 129 - Reads recent Windows event log entries.
.DESCRIPTION
    Pattern: EventLogRecent. This script variant #129 provides a focused admin/data utility.
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
# Variant marker: UTK-129-EventLogRecent
