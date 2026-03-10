param([Parameter(Mandatory=$true)][string]$TaskName,[Parameter(Mandatory=$true)][string]$ScriptPath)
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At 9am
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Description 'Daily script task' -Force
