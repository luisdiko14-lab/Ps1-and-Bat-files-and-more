<#
.SYNOPSIS
Writes structured log lines to console and optional file.
#>
[CmdletBinding()]
param(
    [string]$Message = 'Wave Inspector started',
    [ValidateSet('INFO','WARN','ERROR')]
    [string]$Level = 'INFO',
    [string]$LogPath
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-WaveInspectorTool {
    $line = "$(Get-Date -Format o) [$Level] $Message"
    Write-Host $line
    if ($LogPath) { Add-Content -Path $LogPath -Value $line -Encoding UTF8 }
    $line
}

Invoke-WaveInspectorTool
