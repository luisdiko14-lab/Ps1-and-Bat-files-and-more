param([Parameter(Mandatory=$true)][string]$Uri,[Parameter(Mandatory=$true)][string]$OutFile)
Invoke-WebRequest -Uri $Uri -OutFile $OutFile
Write-Host "Saved to $OutFile" -ForegroundColor Green
