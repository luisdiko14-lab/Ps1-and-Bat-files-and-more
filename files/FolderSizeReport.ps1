param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [int]$Top = 15
)

if (-not (Test-Path -Path $Path -PathType Container)) {
    throw "Folder not found: $Path"
}

Write-Host "=== Folder Size Report ===" -ForegroundColor Cyan
Write-Host "Path: $Path"

Get-ChildItem -Path $Path -Directory -Force |
    ForEach-Object {
        $size = (Get-ChildItem -Path $_.FullName -Recurse -File -Force -ErrorAction SilentlyContinue |
            Measure-Object -Property Length -Sum).Sum

        [PSCustomObject]@{
            Folder = $_.Name
            SizeMB = [math]::Round(($size / 1MB), 2)
        }
    } |
    Sort-Object SizeMB -Descending |
    Select-Object -First $Top |
    Format-Table -AutoSize
