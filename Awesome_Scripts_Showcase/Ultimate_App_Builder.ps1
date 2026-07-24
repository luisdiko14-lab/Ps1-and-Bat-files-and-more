$script:projectRoot = $null
$script:currentFilePath = $null
$script:useGui = $false
try {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
    Add-Type -AssemblyName System.Drawing -ErrorAction Stop
    $isWindowsPlatform = $false
    try {
        $isWindowsPlatform = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows)
    }
    catch {
        if (Get-Variable -Name IsWindows -Scope Global -ErrorAction SilentlyContinue) { $isWindowsPlatform = $IsWindows }
    }

    if ($isWindowsPlatform -or $PSVersionTable.PSEdition -eq 'Desktop') {
        $script:useGui = $true
    }
}
catch {
    $script:useGui = $false
}

function Get-ProjectRoot {
    if (-not $script:projectRoot) {
        $desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
        $script:projectRoot = Join-Path $desktopPath 'PROJECT'
        if (-not (Test-Path $script:projectRoot)) {
            New-Item -ItemType Directory -Path $script:projectRoot -Force | Out-Null
        }
    }
    return $script:projectRoot
}

function Set-Status {
    param(
        [string]$Message,
        [string]$Color = 'Gray'
    )

    if ($null -ne $statusLabel) {
        $statusLabel.Text = $Message
        try {
            $statusLabel.ForeColor = [System.Drawing.Color]::FromName($Color)
        }
        catch {
            # ignore invalid color names
        }
    }
    else {
        Write-Host $Message
    }
}

function Refresh-FileList {
    $root = Get-ProjectRoot
    $items = Get-ChildItem -Path $root -File | Sort-Object Name
    $fileListBox.Items.Clear()
    foreach ($item in $items) {
        [void]$fileListBox.Items.Add($item.Name)
    }

    if ($fileListBox.Items.Count -gt 0) {
        $fileListBox.SelectedIndex = 0
    }
}

function New-ProjectFile {
    param(
        [string]$Name,
        [string]$Extension
    )

    if ([string]::IsNullOrWhiteSpace($Name)) {
        Set-Status 'Please enter a file name.' 'Red'
        return
    }

    $safeName = $Name.Trim()
    if ($safeName -notmatch '^[A-Za-z0-9._ -]+$') {
        Set-Status 'Only letters, numbers, spaces, dot, underscore, and dash are allowed.' 'Red'
        return
    }

    if ($Extension -and -not $safeName.EndsWith($Extension)) {
        $safeName = "$safeName$Extension"
    }

    $path = Join-Path (Get-ProjectRoot) $safeName
    if (-not (Test-Path $path)) {
        $template = switch ($Extension) {
            '.ps1' { "# PowerShell app script\nWrite-Host 'Hello from your app!'\n" }
            '.py' { "# Python app script\nprint('Hello from your app!')\n" }
            '.bat' { "@echo off\necho Hello from your app!\n" }
            '.json' { @'
{
    "appName": "My App",
    "theme": "dark",
    "version": "1.0"
}
@'
            }
            default { "# New file\n" }
        }
        Set-Content -Path $path -Value $template -Encoding UTF8
    }

    $script:currentFilePath = $path
    $editor.Text = Get-Content -Path $path -Raw
    $nameBox.Text = [System.IO.Path]::GetFileNameWithoutExtension($safeName)
    $extensionBox.SelectedItem = $Extension
    Refresh-FileList
    Set-Status "Created $safeName" 'Green'
}

function Save-CurrentFile {
    if ([string]::IsNullOrWhiteSpace($nameBox.Text)) {
        Set-Status 'Enter a file name before saving.' 'Red'
        return
    }

    $extension = $extensionBox.SelectedItem
    $fileName = $nameBox.Text.Trim()
    if ($extension -and -not $fileName.EndsWith($extension)) {
        $fileName = "$fileName$extension"
    }

    $path = Join-Path (Get-ProjectRoot) $fileName
    Set-Content -Path $path -Value $editor.Text -Encoding UTF8
    $script:currentFilePath = $path
    Refresh-FileList
    Set-Status "Saved $fileName" 'Green'
}

function Open-SelectedFile {
    if (-not $fileListBox.SelectedItem) {
        return
    }

    $path = Join-Path (Get-ProjectRoot) $fileListBox.SelectedItem
    if (Test-Path $path) {
        $script:currentFilePath = $path
        $editor.Text = Get-Content -Path $path -Raw
        $nameBox.Text = [System.IO.Path]::GetFileNameWithoutExtension($fileListBox.SelectedItem)
        $extensionBox.SelectedItem = [System.IO.Path]::GetExtension($fileListBox.SelectedItem)
        Set-Status "Opened $($fileListBox.SelectedItem)" 'Green'
    }
}

function Upload-File {
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Filter = 'All files (*.*)|*.*'
    $dialog.Title = 'Upload a file into your PROJECT folder'

    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $source = $dialog.FileName
        $destName = [System.IO.Path]::GetFileName($source)
        $destPath = Join-Path (Get-ProjectRoot) $destName
        Copy-Item -Path $source -Destination $destPath -Force
        Refresh-FileList
        Set-Status "Uploaded $destName" 'Green'
    }
}

function Create-ProjectTemplate {
    $root = Get-ProjectRoot

    $configPath = Join-Path $root 'app_config.json'
    $configContent = @{
        appName = 'My Omega App'
        theme = 'dark'
        version = '1.0'
        projectFolder = $root
    } | ConvertTo-Json -Depth 4
    Set-Content -Path $configPath -Value $configContent -Encoding UTF8

    $starterPath = Join-Path $root 'main_app.ps1'
    if (-not (Test-Path $starterPath)) {
        $starterContent = @'
Write-Host 'Welcome to your custom app!'
Write-Host 'Edit this file or create new ones in your PROJECT folder.'
@'
        Set-Content -Path $starterPath -Value $starterContent -Encoding UTF8
    }

    $batchPath = Join-Path $root 'launch_app.bat'
    if (-not (Test-Path $batchPath)) {
        $batchContent = @'
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0main_app.ps1"
@'
        Set-Content -Path $batchPath -Value $batchContent -Encoding UTF8
    }

    $readmePath = Join-Path $root 'README.txt'
    if (-not (Test-Path $readmePath)) {
        $readmeContent = @'
Omega App Builder project
- Edit main_app.ps1 to build your app
- app_config.json stores your app settings
- launch_app.bat runs the starter script
@'
        Set-Content -Path $readmePath -Value $readmeContent -Encoding UTF8
    }

    Refresh-FileList
    Set-Status 'Created starter template files' 'Green'
}

function Open-ProjectFolder {
    $root = Get-ProjectRoot
    if (Test-Path $root) {
        Invoke-Item $root
        Set-Status 'Opened PROJECT folder' 'Cyan'
    }
}

function Check-ForErrors {
    if (-not $script:currentFilePath) {
        Set-Status 'Create or open a file first.' 'Red'
        return
    }

    $content = $editor.Text
    $ext = [System.IO.Path]::GetExtension($script:currentFilePath)
    $messages = New-Object System.Collections.Generic.List[string]

    switch ($ext.ToLower()) {
        '.ps1' {
            $tokens = $null
            $errors = $null
            [System.Management.Automation.Language.Parser]::ParseInput($content, [ref]$tokens, [ref]$errors) | Out-Null
            if ($errors) {
                foreach ($error in $errors) {
                    [void]$messages.Add("Line $($error.Extent.StartLineNumber): $($error.Message)")
                }
            }
            else {
                [void]$messages.Add('No PowerShell parse errors found.')
            }
        }
        '.py' {
            $tempPath = Join-Path ([System.IO.Path]::GetTempPath()) ("check_" + [System.IO.Path]::GetRandomFileName() + '.py')
            try {
                Set-Content -Path $tempPath -Value $content -Encoding UTF8
                $pythonCommand = if (Get-Command python -ErrorAction SilentlyContinue) { 'python' } elseif (Get-Command python3 -ErrorAction SilentlyContinue) { 'python3' } else { $null }
                if ($pythonCommand) {
                    & $pythonCommand -m py_compile $tempPath 2>$null | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        [void]$messages.Add('No Python syntax errors found.')
                    }
                    else {
                        [void]$messages.Add('Python reported a problem. Check the code and try again.')
                    }
                }
                else {
                    [void]$messages.Add('Python was not found on PATH, so syntax checking was skipped.')
                }
            }
            finally {
                Remove-Item -Path $tempPath -ErrorAction SilentlyContinue
            }
        }
        '.bat' {
            if ($content -match '(?i)@echo off|echo|set|if|goto|call') {
                [void]$messages.Add('Batch file structure looks fine. No obvious parse issue detected.')
            }
            else {
                [void]$messages.Add('Batch file appears empty. Add a few commands and try again.')
            }
        }
        '.json' {
            try {
                $null = $content | ConvertFrom-Json
                [void]$messages.Add('No JSON errors found.')
            }
            catch {
                [void]$messages.Add("JSON error: $($_.Exception.Message)")
            }
        }
        default {
            [void]$messages.Add('No checker is available for this extension yet.')
        }
    }

    $errorBox.Text = ($messages -join [Environment]::NewLine)
    Set-Status 'Checked for errors' 'Cyan'
}

function Run-CurrentFile {
    if (-not $script:currentFilePath) {
        Set-Status 'Create or open a file first.' 'Red'
        return
    }

    $ext = [System.IO.Path]::GetExtension($script:currentFilePath)
    $workingDirectory = Get-ProjectRoot
    $fileName = [System.IO.Path]::GetFileName($script:currentFilePath)

    try {
        switch ($ext.ToLower()) {
            '.ps1' {
                $psLauncher = if (Get-Command pwsh -ErrorAction SilentlyContinue) { 'pwsh' } elseif (Get-Command powershell.exe -ErrorAction SilentlyContinue) { 'powershell.exe' } else { $null }
                if ($psLauncher) {
                    Start-Process -FilePath $psLauncher -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$($script:currentFilePath)`"" -WorkingDirectory $workingDirectory -WindowStyle Normal | Out-Null
                }
                else {
                    & $script:currentFilePath
                }
            }
            '.py' {
                $pyLauncher = if (Get-Command python -ErrorAction SilentlyContinue) { 'python' } elseif (Get-Command python3 -ErrorAction SilentlyContinue) { 'python3' } else { $null }
                if ($pyLauncher) {
                    Start-Process -FilePath $pyLauncher -ArgumentList "`"$($script:currentFilePath)`"" -WorkingDirectory $workingDirectory -WindowStyle Normal | Out-Null
                }
                else {
                    throw 'Python was not found on PATH.'
                }
            }
            '.bat' {
                if (Get-Command cmd.exe -ErrorAction SilentlyContinue) {
                    Start-Process -FilePath 'cmd.exe' -ArgumentList "/c `"$($script:currentFilePath)`"" -WorkingDirectory $workingDirectory -WindowStyle Normal | Out-Null
                }
                else {
                    Write-Host 'Batch files can only be launched from a Windows shell.' -ForegroundColor Yellow
                }
            }
            default {
                Start-Process -FilePath $script:currentFilePath -WorkingDirectory $workingDirectory -WindowStyle Normal | Out-Null
            }
        }

        Set-Status "Started $fileName" 'Green'
    }
    catch {
        Set-Status "Could not run $fileName: $($_.Exception.Message)" 'Red'
    }
}

if (-not $script:useGui) {
    Write-Host 'GUI mode is unavailable in this environment. Falling back to a simple console experience.' -ForegroundColor Yellow
    $root = Get-ProjectRoot
    Write-Host "PROJECT folder: $root"
    Write-Host 'Files:'
    $files = Get-ChildItem -Path $root -File | Select-Object -ExpandProperty Name
    if ($files) {
        $files | ForEach-Object { Write-Host " - $_" }
    }
    else {
        Write-Host ' - No files yet. Create one in the PROJECT folder and re-run the script.'
    }
    Write-Host ''
    Write-Host 'The app builder is ready for file-based editing in this environment.'
    exit 0
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Omega App Builder'
$form.Size = New-Object System.Drawing.Size(1200, 760)
$form.StartPosition = 'CenterScreen'
$form.MinimumSize = New-Object System.Drawing.Size(1000, 650)

$topPanel = New-Object System.Windows.Forms.Panel
$topPanel.Dock = 'Top'
$topPanel.Height = 120
$topPanel.Padding = New-Object System.Windows.Forms.Padding(10)

$projectLabel = New-Object System.Windows.Forms.Label
$projectLabel.Text = "PROJECT folder: $(Get-ProjectRoot)"
$projectLabel.AutoSize = $true
$projectLabel.Font = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
$projectLabel.Location = New-Object System.Drawing.Point(10, 10)
$topPanel.Controls.Add($projectLabel)

$nameBox = New-Object System.Windows.Forms.TextBox
$nameBox.Width = 200
$nameBox.Location = New-Object System.Drawing.Point(10, 40)
$topPanel.Controls.Add($nameBox)

$extensionBox = New-Object System.Windows.Forms.ComboBox
$extensionBox.DropDownStyle = 'DropDownList'
$extensionBox.Width = 90
$extensionBox.Items.Add('.ps1')
$extensionBox.Items.Add('.py')
$extensionBox.Items.Add('.bat')
$extensionBox.Items.Add('.json')
$extensionBox.Items.Add('.txt')
$extensionBox.Location = New-Object System.Drawing.Point(220, 40)
$extensionBox.SelectedIndex = 0
$topPanel.Controls.Add($extensionBox)

$newButton = New-Object System.Windows.Forms.Button
$newButton.Text = 'New File'
$newButton.Location = New-Object System.Drawing.Point(320, 38)
$newButton.Add_Click({
    New-ProjectFile -Name $nameBox.Text -Extension $extensionBox.SelectedItem
})
$topPanel.Controls.Add($newButton)

$saveButton = New-Object System.Windows.Forms.Button
$saveButton.Text = 'Save'
$saveButton.Location = New-Object System.Drawing.Point(410, 38)
$saveButton.Add_Click({ Save-CurrentFile })
$topPanel.Controls.Add($saveButton)

$runButton = New-Object System.Windows.Forms.Button
$runButton.Text = 'Run'
$runButton.Location = New-Object System.Drawing.Point(490, 38)
$runButton.Add_Click({ Run-CurrentFile })
$topPanel.Controls.Add($runButton)

$checkButton = New-Object System.Windows.Forms.Button
$checkButton.Text = 'Check Errors'
$checkButton.Location = New-Object System.Drawing.Point(570, 38)
$checkButton.Add_Click({ Check-ForErrors })
$topPanel.Controls.Add($checkButton)

$uploadButton = New-Object System.Windows.Forms.Button
$uploadButton.Text = 'Upload File'
$uploadButton.Location = New-Object System.Drawing.Point(670, 38)
$uploadButton.Add_Click({ Upload-File })
$topPanel.Controls.Add($uploadButton)

$templateButton = New-Object System.Windows.Forms.Button
$templateButton.Text = 'Create Template'
$templateButton.Location = New-Object System.Drawing.Point(770, 38)
$templateButton.Add_Click({ Create-ProjectTemplate })
$topPanel.Controls.Add($templateButton)

$folderButton = New-Object System.Windows.Forms.Button
$folderButton.Text = 'Open Folder'
$folderButton.Location = New-Object System.Drawing.Point(900, 38)
$folderButton.Add_Click({ Open-ProjectFolder })
$topPanel.Controls.Add($folderButton)

$mainSplit = New-Object System.Windows.Forms.SplitContainer
$mainSplit.Dock = 'Fill'
$mainSplit.FixedPanel = 'Panel1'
$mainSplit.Panel1MinSize = 240
$mainSplit.Panel2MinSize = 400

$leftPanel = New-Object System.Windows.Forms.Panel
$leftPanel.Dock = 'Fill'
$leftPanel.Padding = New-Object System.Windows.Forms.Padding(10)

$leftLabel = New-Object System.Windows.Forms.Label
$leftLabel.Text = 'Files in PROJECT'
$leftLabel.AutoSize = $true
$leftLabel.Font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
$leftLabel.Location = New-Object System.Drawing.Point(10, 0)
$leftPanel.Controls.Add($leftLabel)

$fileListBox = New-Object System.Windows.Forms.ListBox
$fileListBox.Location = New-Object System.Drawing.Point(10, 25)
$fileListBox.Size = New-Object System.Drawing.Size(210, 420)
$fileListBox.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right -bor [System.Windows.Forms.AnchorStyles]::Bottom
$fileListBox.add_SelectedIndexChanged({ Open-SelectedFile })
$fileListBox.add_DoubleClick({ Open-SelectedFile })
$leftPanel.Controls.Add($fileListBox)

$mainSplit.Panel1.Controls.Add($leftPanel)

$rightPanel = New-Object System.Windows.Forms.Panel
$rightPanel.Dock = 'Fill'
$rightPanel.Padding = New-Object System.Windows.Forms.Padding(10)

$editorLabel = New-Object System.Windows.Forms.Label
$editorLabel.Text = 'Editor'
$editorLabel.AutoSize = $true
$editorLabel.Font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
$editorLabel.Location = New-Object System.Drawing.Point(10, 0)
$rightPanel.Controls.Add($editorLabel)

$editor = New-Object System.Windows.Forms.TextBox
$editor.Multiline = $true
$editor.ScrollBars = 'Both'
$editor.Font = New-Object System.Drawing.Font('Consolas', 10)
$editor.Location = New-Object System.Drawing.Point(10, 25)
$editor.Size = New-Object System.Drawing.Size(650, 360)
$editor.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Bottom -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right
$rightPanel.Controls.Add($editor)

$errorLabel = New-Object System.Windows.Forms.Label
$errorLabel.Text = 'Error / Check Output'
$errorLabel.AutoSize = $true
$errorLabel.Font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
$errorLabel.Location = New-Object System.Drawing.Point(10, 395)
$rightPanel.Controls.Add($errorLabel)

$errorBox = New-Object System.Windows.Forms.TextBox
$errorBox.Multiline = $true
$errorBox.ScrollBars = 'Both'
$errorBox.Font = New-Object System.Drawing.Font('Consolas', 9)
$errorBox.Location = New-Object System.Drawing.Point(10, 420)
$errorBox.Size = New-Object System.Drawing.Size(650, 120)
$errorBox.Anchor = [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right -bor [System.Windows.Forms.AnchorStyles]::Bottom
$errorBox.ReadOnly = $true
$rightPanel.Controls.Add($errorBox)

$mainSplit.Panel2.Controls.Add($rightPanel)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.AutoSize = $true
$statusLabel.Location = New-Object System.Drawing.Point(10, 545)
$statusLabel.Anchor = [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Bottom
$statusLabel.Text = 'Ready'
$rightPanel.Controls.Add($statusLabel)

$form.Controls.Add($mainSplit)
$form.Controls.Add($topPanel)

$topPanel.BringToFront()
$mainSplit.BringToFront()

Get-ProjectRoot | Out-Null
Refresh-FileList

if ($fileListBox.Items.Count -eq 0) {
    New-ProjectFile -Name 'welcome_app' -Extension '.ps1'
}
else {
    Open-SelectedFile
}

Set-Status 'Omega App Builder ready.' 'Green'
[void]$form.ShowDialog()
Write-Host "Omega app is running"