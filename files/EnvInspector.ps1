$names='COMPUTERNAME','USERNAME','USERPROFILE','TEMP','PATH'
$names | ForEach-Object { [PSCustomObject]@{ Name=$_; Value=[Environment]::GetEnvironmentVariable($_) } } | Format-Table -Wrap
