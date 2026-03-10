param([Parameter(Mandatory=$true)][string]$Name)
$svc = Get-Service -Name $Name -ErrorAction Stop
if ($svc.Status -eq 'Running') { Restart-Service -Name $Name -Force }
else { Start-Service -Name $Name }
Get-Service -Name $Name | Select-Object Name, Status
