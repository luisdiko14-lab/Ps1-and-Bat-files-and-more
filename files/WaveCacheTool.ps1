<#
.SYNOPSIS
Pings targets and prints reachability summary.
#>
[CmdletBinding()]
param(
    [string[]]$Targets = @('localhost'),
    [int]$Count = 1
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-WaveCacheTool {
    foreach ($target in $Targets) {
        $ok = Test-Connection -ComputerName $target -Count $Count -Quiet -ErrorAction SilentlyContinue
        [pscustomobject]@{ Target = $target; Reachable = [bool]$ok; CheckedAt = Get-Date }
    }
}

Invoke-WaveCacheTool
