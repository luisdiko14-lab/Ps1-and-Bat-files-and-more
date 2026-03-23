@('#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#845EC2') | ForEach-Object { [PSCustomObject]@{Hex=$_} } | Format-Table -AutoSize
