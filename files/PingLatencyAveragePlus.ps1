param([string]$ComputerName='8.8.8.8',[int]$Count=4)
$r=Test-Connection -ComputerName $ComputerName -Count $Count -ErrorAction Stop
[PSCustomObject]@{ComputerName=$ComputerName;AverageMs=[math]::Round((($r|Measure-Object ResponseTime -Average).Average),2)} | Format-List
