$computer = Get-CimInstance Win32_ComputerSystem
$os = Get-CimInstance Win32_OperatingSystem
$bios = Get-CimInstance Win32_BIOS

Write-Host "=== Quick System Report ===" -ForegroundColor Cyan
Write-Host ("Computer Name : {0}" -f $env:COMPUTERNAME)
Write-Host ("Manufacturer  : {0}" -f $computer.Manufacturer)
Write-Host ("Model         : {0}" -f $computer.Model)
Write-Host ("OS            : {0}" -f $os.Caption)
Write-Host ("Version       : {0}" -f $os.Version)
Write-Host ("BIOS Version  : {0}" -f ($bios.SMBIOSBIOSVersion -join ', '))
Write-Host ("Last Boot     : {0}" -f $os.LastBootUpTime)
