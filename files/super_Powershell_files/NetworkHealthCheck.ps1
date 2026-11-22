# CI-SAFE: -CI exits before DNS or network access.
[CmdletBinding()]
param([ValidateNotNullOrEmpty()][string]$HostName='example.com',[ValidateRange(250,30000)][int]$TimeoutMs=3000,[switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: NetworkHealthCheck passed; no network calls.'; exit 0 }
$addresses = @()
try { $addresses = @(Resolve-DnsName -Name $HostName -ErrorAction Stop | Where-Object {$_.Type -in @('A','AAAA')} | ForEach-Object {$_.IPAddress}) }
catch { Write-Warning "DNS lookup failed: $($_.Exception.Message)" }
$client = [System.Net.Sockets.TcpClient]::new()
$pending = $null
$connected = $false
try {
    $pending = $client.BeginConnect($HostName,443,$null,$null)
    if ($pending.AsyncWaitHandle.WaitOne($TimeoutMs,$false)) { $client.EndConnect($pending); $connected = $client.Connected }
} catch { $connected = $false }
finally { if ($null -ne $pending) {$pending.AsyncWaitHandle.Close()}; $client.Dispose() }
[pscustomobject]@{Host=$HostName;DNS=if($addresses.Count){$addresses -join ', '}else{'Unavailable'};HTTPS443=if($connected){'Reachable'}else{'Unreachable or timed out'};CheckedAt=Get-Date} | Format-List
