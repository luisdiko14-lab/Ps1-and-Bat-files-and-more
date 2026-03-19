$os = Get-CimInstance Win32_OperatingSystem
$boot = $os.LastBootUpTime
[PSCustomObject]@{ Computer=$env:COMPUTERNAME; LastBoot=$boot; UptimeHours=[math]::Round(((Get-Date)-$boot).TotalHours,2) } | Format-List
