# Colorful PowerShell progress bar and folder setup
$Host.UI.RawUI.WindowTitle = 'Luis Toolkit - Colorful Progress Bar'

$folderName = Read-Host 'Enter the folder name to create'
if ([string]::IsNullOrWhiteSpace($folderName)) {
    Write-Error 'A folder name is required.'
    exit 1
}

try {
    $resolvedPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $folderName))
    $basePath = [System.IO.Path]::GetFullPath((Get-Location).Path)
    if (-not $resolvedPath.StartsWith($basePath, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'The folder must be created inside the current directory.'
    }
    New-Item -ItemType Directory -Path $resolvedPath -Force -ErrorAction Stop | Out-Null
    $logFile = Join-Path $resolvedPath 'Log.txt'
    'Log started' | Set-Content -Path $logFile -Encoding UTF8

    for ($i = 1; $i -le 50; $i++) {
        $percent = $i * 2
        Write-Progress -Activity 'Creating files...' -Status "$percent% complete" -PercentComplete $percent
        Start-Sleep -Milliseconds 100
    }
    Write-Progress -Activity 'Creating files...' -Completed
    'Log complete' | Add-Content -Path $logFile -Encoding UTF8
    Write-Host "Folder and log created successfully: $resolvedPath" -ForegroundColor Green
}
catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    exit 1
}
