$paths=@($env:TEMP,(Join-Path $env:WINDIR 'Temp'))
$paths | ForEach-Object { if(Test-Path $_){ [PSCustomObject]@{Path=$_;Items=(Get-ChildItem -Path $_ -Force -ErrorAction SilentlyContinue | Measure-Object).Count} } } | Format-Table -AutoSize
