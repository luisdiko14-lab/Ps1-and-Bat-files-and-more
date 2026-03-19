param([Parameter(Mandatory=$true)][string]$Pattern,[string]$Path='.')
Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern $Pattern | Select-Object Path,LineNumber,Line | Format-Table -Wrap
