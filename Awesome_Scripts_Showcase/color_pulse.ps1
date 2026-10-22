$colors = 'Red','Yellow','Green','Cyan','Magenta','Blue'
for ($i = 0; $i -lt 20; $i++) {
    $color = $colors[$i % $colors.Count]
    Write-Host ("[" + ('#' * ($i % 10 + 1)) + "] Pulsing...") -ForegroundColor $color
    Start-Sleep -Milliseconds 120
}
Write-Host 'Done!' -ForegroundColor Green
