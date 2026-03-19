param([string]$Source='.', [string]$Destination='logs_archive.zip')
$logs = Get-ChildItem -Path $Source -Recurse -File -Include *.log,*.txt
if ($logs) { $logs | Compress-Archive -DestinationPath $Destination -Force; Write-Host "Created $Destination" }
else { Write-Host "No log/txt files found." }
