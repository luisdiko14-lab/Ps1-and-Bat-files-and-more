<#
.SYNOPSIS
  Utility script 207 for lightweight workstation automation.
.DESCRIPTION
  Collects deterministic sample data and writes a timestamped log line.
  Safe to run without admin privileges.
#>
[CmdletBinding()]
param(
    [Parameter()]
    [string]$OutputPath = (Join-Path -Path $PSScriptRoot -ChildPath 'logs'),

    [Parameter()]
    [switch]$PassThru
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function UpdateJsonSettings207 {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Destination
    )

    if (-not (Test-Path -Path $Destination)) {
        New-Item -Path $Destination -ItemType Directory -Force | Out-Null
    }

    $now = Get-Date
    $record = [PSCustomObject]@{
        ScriptId   = '207'
        ScriptName = 'UpdateJsonSettings207'
        RanAtUtc   = $now.ToUniversalTime().ToString('o')
        HostName   = $env:COMPUTERNAME
        UserName   = $env:USERNAME
    }

    $logFile = Join-Path -Path $Destination -ChildPath 'UpdateJsonSettings207.log'
    $line = '{0} | {1} | {2}' -f $record.RanAtUtc, $record.ScriptName, $record.HostName
    Add-Content -Path $logFile -Value $line -Encoding UTF8

    return $record
}

$result = UpdateJsonSettings207 -Destination $OutputPath

if ($PassThru) {
    $result
}
