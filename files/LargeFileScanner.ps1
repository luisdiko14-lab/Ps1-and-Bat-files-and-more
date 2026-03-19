param([string]$Path='.', [int]$MinMB=50)
Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -ge ($MinMB * 1MB) } |
    Select-Object FullName, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}} |
    Sort-Object SizeMB -Descending |
    Format-Table -AutoSize
