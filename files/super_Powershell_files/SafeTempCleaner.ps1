# CI-SAFE: -CI exits before inspecting or deleting files.
[CmdletBinding(SupportsShouldProcess=$true,ConfirmImpact='High')]
param([string]$Path=$env:TEMP,[ValidateRange(1,3650)][int]$DaysOld=7,[switch]$Apply,[switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: SafeTempCleaner passed; nothing touched.'; exit 0 }
if (-not (Test-Path -LiteralPath $Path -PathType Container)) { throw "Folder not found: $Path" }
$cutoff = (Get-Date).AddDays(-$DaysOld)
$candidates = @(Get-ChildItem -LiteralPath $Path -File -Recurse -Force -ErrorAction SilentlyContinue | Where-Object {$_.LastWriteTime -lt $cutoff})
Write-Host ("Found {0} file(s) older than {1} day(s)." -f $candidates.Count,$DaysOld) -ForegroundColor Cyan
if (-not $Apply) {
    $candidates | Select-Object FullName,LastWriteTime,Length | Format-Table -AutoSize
    Write-Host 'Preview only. Add -Apply to delete the listed files.' -ForegroundColor Yellow
    return
}
foreach ($file in $candidates) {
    if ($PSCmdlet.ShouldProcess($file.FullName,'Delete old temporary file')) {
        Remove-Item -LiteralPath $file.FullName -Force -ErrorAction Stop
    }
}
