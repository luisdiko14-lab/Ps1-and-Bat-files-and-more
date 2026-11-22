# CI-SAFE: -CI exits before reading Windows event logs.
[CmdletBinding()]
param([ValidateRange(1,90)][int]$Days=7,[ValidateRange(1,5000)][int]$MaxEvents=500,[ValidateSet('System','Application')][string]$LogName='System',[switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: EventLogDigest passed.'; exit 0 }
$start = (Get-Date).AddDays(-$Days)
try { $events = @(Get-WinEvent -FilterHashtable @{LogName=$LogName;StartTime=$start} -MaxEvents $MaxEvents -ErrorAction Stop) }
catch { throw "Could not read the $LogName event log: $($_.Exception.Message)" }
Write-Host ("{0} event(s) from {1} in the last {2} day(s)." -f $events.Count,$LogName,$Days) -ForegroundColor Cyan
$events | Group-Object LevelDisplayName | Sort-Object Count -Descending | Select-Object Name,Count | Format-Table -AutoSize
Write-Host 'Most recent events:' -ForegroundColor Cyan
$events | Select-Object -First 15 TimeCreated,Id,LevelDisplayName,ProviderName,Message | Format-List
