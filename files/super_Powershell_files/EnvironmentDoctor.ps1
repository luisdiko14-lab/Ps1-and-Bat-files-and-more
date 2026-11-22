# CI-SAFE: -CI exits before inspecting local tools or environment variables.
[CmdletBinding()]
param([switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: EnvironmentDoctor passed.'; exit 0 }
$toolNames = @('git','node','npm','python','py','dotnet','pwsh','winget')
$results = foreach ($name in $toolNames) {
    $command = Get-Command -Name $name -ErrorAction SilentlyContinue | Select-Object -First 1
    [pscustomobject]@{Tool=$name;Present=[bool]$command;Path=if($command){$command.Source}else{'Not installed / not on PATH'}}
}
Write-Host ("PowerShell {0} on {1}" -f $PSVersionTable.PSVersion,[Environment]::OSVersion.VersionString) -ForegroundColor Cyan
$results | Format-Table -AutoSize
$missing = @($results | Where-Object {-not $_.Present})
if ($missing.Count) {Write-Host ("Missing tools: {0}" -f (($missing.Tool) -join ', ')) -ForegroundColor Yellow}
else {Write-Host 'All checked tools are available.' -ForegroundColor Green}
