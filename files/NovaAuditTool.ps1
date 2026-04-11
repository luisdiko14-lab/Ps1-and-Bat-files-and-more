<#
.SYNOPSIS
Collect quick environment details and save them in JSON.
#>
[CmdletBinding()]
param(
    [string]$OutputPath = "$env:TEMP/NovaAudit.json",
    [switch]$PassThru
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-NovaAuditTool {
    $data = [pscustomobject]@{
        ComputerName = $env:COMPUTERNAME
        UserName     = $env:USERNAME
        OsVersion    = [Environment]::OSVersion.VersionString
        Timestamp    = Get-Date
        Tool         = 'NovaAudit'
    }
    $data | ConvertTo-Json -Depth 4 | Set-Content -Path $OutputPath -Encoding UTF8
    if ($PassThru) { return $data }
    Write-Host "Saved report to $OutputPath" -ForegroundColor Green
}

Invoke-NovaAuditTool
