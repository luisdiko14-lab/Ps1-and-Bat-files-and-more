$start=(Get-Date).Date
0..6 | ForEach-Object { $d=$start.AddDays($_); [PSCustomObject]@{Date=$d.ToString('yyyy-MM-dd');Day=$d.DayOfWeek} } | Format-Table -AutoSize
