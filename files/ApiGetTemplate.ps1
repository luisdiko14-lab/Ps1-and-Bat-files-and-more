param([Parameter(Mandatory=$true)][string]$Uri)
$response = Invoke-RestMethod -Uri $Uri -Method Get
$response | ConvertTo-Json -Depth 8
