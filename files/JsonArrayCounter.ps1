param([Parameter(Mandatory=$true)][string]$Path)
$data=Get-Content -Raw $Path | ConvertFrom-Json
if($data -is [System.Array]){$data.Count}else{1}
