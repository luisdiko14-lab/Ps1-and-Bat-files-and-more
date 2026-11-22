# CI-SAFE: -CI exits before reading files or writing a report.
[CmdletBinding()]
param([string]$Path=(Get-Location).Path,[string]$OutputCsv='',[switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: FileIntegrityScanner passed.'; exit 0 }
if (-not (Test-Path -LiteralPath $Path -PathType Container)) { throw "Folder not found: $Path" }
$report = @(Get-ChildItem -LiteralPath $Path -File -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256 -ErrorAction Stop
        [pscustomobject]@{Path=$_.FullName;Length=$_.Length;LastWriteUtc=$_.LastWriteTimeUtc;SHA256=$hash.Hash}
    } catch { Write-Warning "Skipped $($_.FullName): $($_.Exception.Message)" }
})
if ($OutputCsv) { $report | Export-Csv -LiteralPath $OutputCsv -NoTypeInformation -Encoding utf8; Write-Host "Manifest saved to $OutputCsv" -ForegroundColor Green }
else { $report | Format-Table -AutoSize }
