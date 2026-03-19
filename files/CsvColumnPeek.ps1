param([Parameter(Mandatory=$true)][string]$Path,[int]$Top=5)
Import-Csv -Path $Path | Select-Object -First $Top | Format-Table -AutoSize
