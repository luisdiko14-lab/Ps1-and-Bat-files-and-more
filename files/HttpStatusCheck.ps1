param([Parameter(Mandatory=$true)][string]$Url)
try {
    $res = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 10
    [PSCustomObject]@{ Url=$Url; StatusCode=$res.StatusCode; StatusDescription=$res.StatusDescription }
} catch {
    Write-Error $_
}
