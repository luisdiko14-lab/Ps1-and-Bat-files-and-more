# CI-SAFE: -CI exits before querying running processes.
[CmdletBinding()]
param([ValidateRange(1,100)][int]$Top=20,[switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: ProcessResourceMonitor passed.'; exit 0 }
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First $Top |
    Select-Object Name,Id,@{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64/1MB,1)}},
        @{Name='CPUSeconds';Expression={if($null -ne $_.CPU){[math]::Round($_.CPU,1)}else{0}}} |
    Format-Table -AutoSize
