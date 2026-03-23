1..10 | ForEach-Object { Write-Progress -Activity 'Cool Demo' -Status "Step $_ of 10" -PercentComplete ($_ * 10); Start-Sleep -Milliseconds 80 }
Write-Progress -Activity 'Cool Demo' -Completed
