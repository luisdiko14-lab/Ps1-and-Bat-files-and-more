param([Parameter(Mandatory=$true)][string]$Path,[int]$Tail=20)
Get-Content -Path $Path -Tail $Tail
