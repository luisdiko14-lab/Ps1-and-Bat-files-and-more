param([ValidateSet('balanced','high','power-saver')][string]$Mode='balanced')
$plans = powercfg /list
switch ($Mode) {
    'balanced' { $guid = ($plans | Select-String -Pattern 'Balanced').ToString().Split()[3] }
    'high' { $guid = ($plans | Select-String -Pattern 'High performance').ToString().Split()[3] }
    'power-saver' { $guid = ($plans | Select-String -Pattern 'Power saver').ToString().Split()[3] }
}
if ($guid) { powercfg /setactive $guid; Write-Host "Activated $Mode" }
