param([Parameter(Mandatory=$true)][string]$Path)
$fsw = New-Object IO.FileSystemWatcher $Path -Property @{IncludeSubdirectories=$true;EnableRaisingEvents=$true}
Register-ObjectEvent $fsw Created -Action { Write-Host "Created: $($Event.SourceEventArgs.FullPath)" }
Register-ObjectEvent $fsw Deleted -Action { Write-Host "Deleted: $($Event.SourceEventArgs.FullPath)" }
Write-Host "Watching $Path. Press Ctrl+C to stop."
while ($true) { Start-Sleep 1 }
