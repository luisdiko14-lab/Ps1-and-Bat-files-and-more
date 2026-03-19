param([string]$OutputPath='.\sample-config.ini')
@"
[general]
name=CoolTool
mode=demo
"@ | Set-Content -Path $OutputPath
Write-Host "Wrote $OutputPath" -ForegroundColor Green
