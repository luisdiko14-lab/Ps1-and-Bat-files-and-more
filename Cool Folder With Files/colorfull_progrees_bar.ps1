# Colorful progress bar
for ($i=0; $i -le 100; $i+=2) {
    Write-Progress -Activity "Loading Awesome Script" -Status "$i% Complete" -PercentComplete $i
    Start-Sleep 0.05
}
Write-Host "Done!" -ForegroundColor Green
