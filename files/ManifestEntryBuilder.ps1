param([string]$Name='example.ps1',[string]$Type='powershell',[string]$Info='Example utility',[string]$Author='Luis')
[PSCustomObject]@{name=$Name;type=$Type;info=$Info;author=$Author} | ConvertTo-Json
