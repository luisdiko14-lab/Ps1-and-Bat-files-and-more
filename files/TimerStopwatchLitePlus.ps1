$sw=[System.Diagnostics.Stopwatch]::StartNew()
Start-Sleep -Milliseconds 250
$sw.Stop()
[PSCustomObject]@{Milliseconds=$sw.ElapsedMilliseconds} | Format-List
