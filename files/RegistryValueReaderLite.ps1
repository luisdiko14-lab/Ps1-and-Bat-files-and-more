param([Parameter(Mandatory=$true)][string]$Path,[Parameter(Mandatory=$true)][string]$Name)
(Get-ItemProperty -Path $Path -Name $Name).$Name
