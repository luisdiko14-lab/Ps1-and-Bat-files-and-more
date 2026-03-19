param(
    [string]$TestHost = "8.8.8.8"
)

Write-Host "=== Network Diagnostics ===" -ForegroundColor Cyan

$adapterInfo = Get-NetIPConfiguration |
    Where-Object { $_.IPv4Address -or $_.IPv6Address } |
    Select-Object InterfaceAlias, InterfaceDescription,
        @{Name='IPv4';Expression={$_.IPv4Address.IPAddress}},
        @{Name='IPv6';Expression={$_.IPv6Address.IPAddress}},
        @{Name='Gateway';Expression={$_.IPv4DefaultGateway.NextHop}}

$adapterInfo | Format-Table -AutoSize

Write-Host "`nTesting connectivity to $TestHost ..." -ForegroundColor Yellow
Test-Connection -ComputerName $TestHost -Count 4 |
    Select-Object Address, ResponseTime, Status |
    Format-Table -AutoSize
