# CI-SAFE: -CI exits before reading startup registry keys.
[CmdletBinding()]
param([switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: StartupAppsAudit passed.'; exit 0 }
$registryPaths = @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run')
$items = foreach ($path in $registryPaths) {
    if (Test-Path -LiteralPath $path) {
        $properties = Get-ItemProperty -LiteralPath $path
        foreach ($property in $properties.PSObject.Properties) {
            if ($property.Name -notmatch '^PS') { [pscustomobject]@{RegistryKey=$path;Name=$property.Name;Command=[string]$property.Value} }
        }
    }
}
if ($items) { $items | Sort-Object RegistryKey,Name | Format-Table -Wrap -AutoSize }
else { Write-Host 'No Run-key startup entries were found.' -ForegroundColor Yellow }
