# Animate "HELLO WORLD" in the console
$text = "HELLO WORLD"
while ($true) {
    Clear-Host
    $text = $text.Substring(1) + $text[0]
    Write-Host $text -ForegroundColor Cyan
    Start-Sleep 0.2
}
