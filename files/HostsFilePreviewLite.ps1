$path=Join-Path $env:WINDIR 'System32\drivers\etc\hosts'
if(Test-Path $path){Get-Content -Path $path | Select-Object -First 30}else{Write-Warning 'Hosts file not found.'}
