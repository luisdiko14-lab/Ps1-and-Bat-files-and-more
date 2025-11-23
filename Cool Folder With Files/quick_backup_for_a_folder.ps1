# Quick backup script
$source = Read-Host "Enter folder path to backup"
$destination = "$env:USERPROFILE\Desktop\Backup_" + (Get-Date -Format "yyyyMMdd_HHmmss")
New-Item -ItemType Directory -Path $destination
Copy-Item -Path $source -Recurse -Destination $destination
Write-Host "Backup completed! Saved to $destination" -ForegroundColor Green
