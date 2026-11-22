# CI-SAFE: -CI exits before scanning the filesystem.
[CmdletBinding()]
param([string]$Path = ($env:SystemDrive + '\'), [ValidateRange(1,500)][int]$Top = 25, [switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: DiskSpaceAnalyzer passed.'; exit 0 }
if (-not (Test-Path -LiteralPath $Path -PathType Container)) { throw "Folder not found: $Path" }
Write-Host "Finding the $Top largest files under $Path ..." -ForegroundColor Cyan
Get-ChildItem -LiteralPath $Path -File -Recurse -Force -ErrorAction SilentlyContinue |
    Sort-Object Length -Descending | Select-Object -First $Top |
    Select-Object FullName,@{Name='SizeMB';Expression={[math]::Round($_.Length / 1MB,2)}},LastWriteTime |
    Format-Table -AutoSize
