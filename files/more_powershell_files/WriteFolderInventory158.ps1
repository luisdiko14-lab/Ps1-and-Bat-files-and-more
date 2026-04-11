<#
.SYNOPSIS
  Utility script 158 for lightweight workstation automation.
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

function WriteFolderInventory158 {
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
        ScriptId   = '158'
        ScriptName = 'WriteFolderInventory158'
        RanAtUtc   = $now.ToUniversalTime().ToString('o')
        HostName   = $env:COMPUTERNAME
        UserName   = $env:USERNAME
    }

    $logFile = Join-Path -Path $Destination -ChildPath 'WriteFolderInventory158.log'
    $line = '{0} | {1} | {2}' -f $record.RanAtUtc, $record.ScriptName, $record.HostName
    Add-Content -Path $logFile -Value $line -Encoding UTF8

    return $record
}

$result = WriteFolderInventory158 -Destination $OutputPath

if ($PassThru) {
    $result
}
