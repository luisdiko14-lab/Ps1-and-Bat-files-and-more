param([int]$Count=5)
1..$Count | ForEach-Object { [guid]::NewGuid().Guid }
