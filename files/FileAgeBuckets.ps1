param([string]$Path='.')
$now=Get-Date
Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $days=($now-$_.LastWriteTime).Days; $bucket=if($days -le 1){'0-1'}elseif($days -le 7){'2-7'}elseif($days -le 30){'8-30'}else{'31+'}; [PSCustomObject]@{Bucket=$bucket;File=$_.Name}} | Group-Object Bucket | Select-Object Name,Count | Format-Table -AutoSize
