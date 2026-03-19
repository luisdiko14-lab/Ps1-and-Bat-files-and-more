$paths='HKCU:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\Software\Microsoft\Windows\CurrentVersion\Run'
foreach($path in $paths){ if(Test-Path $path){ Get-ItemProperty -Path $path | Select-Object PSPath,* | Format-List } }
