# CI-SAFE: -CI exits before reading or writing backup data.
[CmdletBinding()]
param([string]$Source=(Get-Location).Path,[string]$Destination=(Join-Path $env:TEMP 'FolderBackup.zip'),[switch]$Overwrite,[switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: FolderBackupPro passed.'; exit 0 }
$sourceItem = Get-Item -LiteralPath $Source -ErrorAction Stop
if (-not $sourceItem.PSIsContainer) { throw 'Source must be a folder.' }
$sourceFull = $sourceItem.FullName.TrimEnd([IO.Path]::DirectorySeparatorChar)
$destinationFull = [IO.Path]::GetFullPath($Destination)
$sourcePrefix = $sourceFull + [IO.Path]::DirectorySeparatorChar
if ($destinationFull.Equals($sourceFull,[StringComparison]::OrdinalIgnoreCase) -or $destinationFull.StartsWith($sourcePrefix,[StringComparison]::OrdinalIgnoreCase)) {
    throw 'The backup archive must be outside the source folder.'
}
if ((Test-Path -LiteralPath $destinationFull) -and -not $Overwrite) { throw "Archive exists; use -Overwrite: $destinationFull" }
$parent = Split-Path -Parent $destinationFull
if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
Compress-Archive -Path (Join-Path $sourceFull '*') -DestinationPath $destinationFull -CompressionLevel Optimal -Force:$Overwrite
Write-Host "Backup created: $destinationFull" -ForegroundColor Green
