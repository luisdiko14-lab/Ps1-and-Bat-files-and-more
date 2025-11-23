$url = Read-Host "Enter a website to ping (example: google.com)"
while ($true) {
    $ping = Test-Connection -ComputerName $url -Count 1 -Quiet
    if ($ping) {
        Write-Host "Website is ONLINE!" -ForegroundColor Green
    } else {
        Write-Host "Website is OFFLINE!" -ForegroundColor Red
    }
    Start-Sleep 2
}
