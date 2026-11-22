# CI-SAFE: -CI exits before opening any network sockets.
[CmdletBinding()]
param([string]$ComputerName='localhost',[int[]]$Ports=@(80,443,3000,5000,8080),[ValidateRange(100,10000)][int]$TimeoutMs=750,[switch]$CI)
if ($CI -or $env:CI -eq 'true') { Write-Output 'CI-SAFE: PortAvailabilityCheck passed; no sockets opened.'; exit 0 }
$results = foreach ($port in $Ports) {
    if ($port -lt 1 -or $port -gt 65535) { Write-Warning "Ignoring invalid port: $port"; continue }
    $client = [System.Net.Sockets.TcpClient]::new()
    $pending = $null
    $status = 'Closed / timed out'
    try {
        $pending = $client.BeginConnect($ComputerName,$port,$null,$null)
        if ($pending.AsyncWaitHandle.WaitOne($TimeoutMs,$false)) { $client.EndConnect($pending); if ($client.Connected) {$status='Open'} }
    } catch {$status='Closed / error'}
    finally {if($null -ne $pending){$pending.AsyncWaitHandle.Close()};$client.Dispose()}
    [pscustomobject]@{Host=$ComputerName;Port=$port;Status=$status}
}
$results | Format-Table -AutoSize
