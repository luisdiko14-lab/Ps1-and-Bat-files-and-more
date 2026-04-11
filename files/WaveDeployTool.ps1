<#
.SYNOPSIS
Calculates simple text statistics for a file.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Path
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-WaveDeployTool {
    $content = Get-Content -Path $Path -ErrorAction Stop
    $text = $content -join "`n"
    [pscustomobject]@{
        Path       = (Resolve-Path $Path).Path
        LineCount  = $content.Count
        WordCount  = ($text | Measure-Object -Word).Words
        CharCount  = $text.Length
    }
}

Invoke-WaveDeployTool
