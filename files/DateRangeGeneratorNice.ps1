param([datetime]$Start=(Get-Date).Date,[datetime]$End=((Get-Date).Date).AddDays(6))
for($d=$Start; $d -le $End; $d=$d.AddDays(1)){ [PSCustomObject]@{Date=$d.ToString('yyyy-MM-dd');Day=$d.DayOfWeek} }
