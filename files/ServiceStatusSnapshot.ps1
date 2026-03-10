param(
    [string]$OutputPath = ".\service-status.csv"
)

$services = Get-Service |
    Sort-Object Status, DisplayName |
    Select-Object DisplayName, Name, Status, StartType

$services | Export-Csv -Path $OutputPath -NoTypeInformation
Write-Host "Service snapshot exported to $OutputPath" -ForegroundColor Green
