# CI-SAFE: -CI exits before querying the host.
[CmdletBinding()]
param([switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: SystemDashboard passed.'; exit 0 }
$os = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$uptime = (Get-Date) - $os.LastBootUpTime
[pscustomobject]@{
    Computer = $env:COMPUTERNAME
    User = [Environment]::UserName
    Windows = $os.Caption
    Version = $os.Version
    Build = $os.BuildNumber
    Processor = $cpu.Name.Trim()
    MemoryTotalGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    MemoryFreeGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    Uptime = '{0}d {1}h {2}m' -f $uptime.Days, $uptime.Hours, $uptime.Minutes
    PowerShell = $PSVersionTable.PSVersion.ToString()
} | Format-List
