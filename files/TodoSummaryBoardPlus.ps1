param([Parameter(Mandatory=$true)][string]$Path)
$lines=Get-Content -Path $Path
[PSCustomObject]@{Open=($lines|Where-Object{$_ -match '^- \[ \]'}).Count;Done=($lines|Where-Object{$_ -match '^- \[x\]'}).Count} | Format-List
