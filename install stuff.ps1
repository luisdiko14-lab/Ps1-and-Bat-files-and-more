#requires -Version 5.1

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------

$script:AppTitle = 'PowerShell Ultimate Hub v1.0'
$script:DefaultUrl = 'https://github.com/luisdiko14-lab/Ps1-and-Bat-files-and-more/archive/refs/tags/final-13v.zip'
$script:DownloadJob = $null
$script:DownloadClient = $null
$script:DownloadTimer = $null
$script:DownloadStarted = $false
$script:DownloadCompleted = $false
$script:DownloadCancelled = $false
$script:CurrentDownloadPath = $null
$script:LastProcessRefresh = [datetime]::MinValue

$downloadsFolder = Join-Path $HOME 'Downloads'
$defaultDirectory = Join-Path $downloadsFolder 'CoolGame'

try {
    if (-not (Test-Path -LiteralPath $defaultDirectory)) {
        New-Item -ItemType Directory -Path $defaultDirectory -Force | Out-Null
    }
} catch {
    $defaultDirectory = $HOME
}

# ------------------------------------------------------------
# Theme
# ------------------------------------------------------------

$script:Colors = @{
    Background = [System.Drawing.Color]::FromArgb(24, 26, 32)
    Panel      = [System.Drawing.Color]::FromArgb(33, 36, 44)
    Input      = [System.Drawing.Color]::FromArgb(42, 46, 56)
    Foreground = [System.Drawing.Color]::FromArgb(235, 238, 245)
    Muted      = [System.Drawing.Color]::FromArgb(165, 172, 186)
    Accent     = [System.Drawing.Color]::FromArgb(91, 140, 255)
    Green      = [System.Drawing.Color]::FromArgb(47, 190, 120)
    Red        = [System.Drawing.Color]::FromArgb(232, 85, 85)
    Orange     = [System.Drawing.Color]::FromArgb(240, 169, 66)
    Border     = [System.Drawing.Color]::FromArgb(61, 66, 79)
}

$script:FontRegular = New-Object System.Drawing.Font(
    'Segoe UI', 9, [System.Drawing.FontStyle]::Regular
)
$script:FontBold = New-Object System.Drawing.Font(
    'Segoe UI Semibold', 9, [System.Drawing.FontStyle]::Bold
)
$script:FontTitle = New-Object System.Drawing.Font(
    'Segoe UI Semibold', 17, [System.Drawing.FontStyle]::Bold
)

# ------------------------------------------------------------
# UI helpers
# ------------------------------------------------------------

function Set-Theme {
    param([System.Windows.Forms.Control]$Control)

    $Control.BackColor = $script:Colors.Background
    $Control.ForeColor = $script:Colors.Foreground
    $Control.Font = $script:FontRegular
}

function New-Label {
    param(
        [string]$Text,
        [int]$X,
        [int]$Y,
        [int]$Width = 300,
        [int]$Height = 24
    )

    $control = New-Object System.Windows.Forms.Label
    $control.Text = $Text
    $control.Location = New-Object System.Drawing.Point($X, $Y)
    $control.Size = New-Object System.Drawing.Size($Width, $Height)
    $control.ForeColor = $script:Colors.Foreground
    $control.BackColor = [System.Drawing.Color]::Transparent
    $control.Font = $script:FontRegular
    return $control
}

function New-TextBox {
    param(
        [string]$Text,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height = 30
    )

    $control = New-Object System.Windows.Forms.TextBox
    $control.Text = $Text
    $control.Location = New-Object System.Drawing.Point($X, $Y)
    $control.Size = New-Object System.Drawing.Size($Width, $Height)
    $control.BackColor = $script:Colors.Input
    $control.ForeColor = $script:Colors.Foreground
    $control.BorderStyle = [System.Windows.Forms.BorderStyle]::FixedSingle
    $control.Font = $script:FontRegular
    return $control
}

function New-Button {
    param(
        [string]$Text,
        [int]$X,
        [int]$Y,
        [int]$Width = 130,
        [int]$Height = 36,
        [System.Drawing.Color]$Color
    )

    $control = New-Object System.Windows.Forms.Button
    $control.Text = $Text
    $control.Location = New-Object System.Drawing.Point($X, $Y)
    $control.Size = New-Object System.Drawing.Size($Width, $Height)
    $control.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $control.FlatAppearance.BorderSize = 0
    $control.BackColor = $Color
    $control.ForeColor = [System.Drawing.Color]::White
    $control.Font = $script:FontBold
    $control.Cursor = [System.Windows.Forms.Cursors]::Hand
    return $control
}

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'SUCCESS', 'WARNING', 'ERROR')]
        [string]$Level = 'INFO'
    )

    if ($null -eq $script:LogBox -or $script:LogBox.IsDisposed) {
        return
    }

    $timestamp = Get-Date -Format 'HH:mm:ss'
    $line = "[$timestamp] [$Level] $Message"

    $color = switch ($Level) {
        'SUCCESS' { $script:Colors.Green }
        'WARNING' { $script:Colors.Orange }
        'ERROR'   { $script:Colors.Red }
        default   { $script:Colors.Muted }
    }

    $script:LogBox.SelectionStart = $script:LogBox.TextLength
    $script:LogBox.SelectionLength = 0
    $script:LogBox.SelectionColor = $color
    $script:LogBox.AppendText($line + [Environment]::NewLine)
    $script:LogBox.SelectionColor = $script:Colors.Foreground
    $script:LogBox.SelectionStart = $script:LogBox.TextLength
    $script:LogBox.ScrollToCaret()
}

function Show-AppError {
    param(
        [string]$Message,
        [string]$Title = 'Operation failed'
    )

    [void][System.Windows.Forms.MessageBox]::Show(
        $script:MainForm,
        $Message,
        $Title,
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )
}

function Format-Bytes {
    param([long]$Bytes)

    if ($Bytes -lt 0) {
        return 'Unknown size'
    }

    if ($Bytes -ge 1TB) {
        return '{0:N2} TB' -f ($Bytes / 1TB)
    }
    if ($Bytes -ge 1GB) {
        return '{0:N2} GB' -f ($Bytes / 1GB)
    }
    if ($Bytes -ge 1MB) {
        return '{0:N2} MB' -f ($Bytes / 1MB)
    }
    if ($Bytes -ge 1KB) {
        return '{0:N2} KB' -f ($Bytes / 1KB)
    }

    return "$Bytes bytes"
}

# ------------------------------------------------------------
# Main window
# ------------------------------------------------------------

$script:MainForm = New-Object System.Windows.Forms.Form
$script:MainForm.Text = $script:AppTitle
$script:MainForm.Size = New-Object System.Drawing.Size(1000, 790)
$script:MainForm.MinimumSize = New-Object System.Drawing.Size(850, 650)
$script:MainForm.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$script:MainForm.BackColor = $script:Colors.Background
$script:MainForm.ForeColor = $script:Colors.Foreground
$script:MainForm.Font = $script:FontRegular
$script:MainForm.AutoScaleMode = [System.Windows.Forms.AutoScaleMode]::Font
$script:MainForm.KeyPreview = $true

$header = New-Object System.Windows.Forms.Panel
$header.Dock = [System.Windows.Forms.DockStyle]::Top
$header.Height = 76
$header.BackColor = $script:Colors.Panel
$script:MainForm.Controls.Add($header)

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = 'PowerShell Ultimate Hub'
$titleLabel.Location = New-Object System.Drawing.Point(22, 12)
$titleLabel.Size = New-Object System.Drawing.Size(500, 32)
$titleLabel.Font = $script:FontTitle
$titleLabel.ForeColor = $script:Colors.Foreground
$titleLabel.BackColor = [System.Drawing.Color]::Transparent
$header.Controls.Add($titleLabel)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = 'DOWNLOAD  /  EXTRACT  /  MONITOR'
$subtitle.Location = New-Object System.Drawing.Point(25, 46)
$subtitle.Size = New-Object System.Drawing.Size(500, 20)
$subtitle.Font = New-Object System.Drawing.Font('Segoe UI', 8)
$subtitle.ForeColor = $script:Colors.Muted
$subtitle.BackColor = [System.Drawing.Color]::Transparent
$header.Controls.Add($subtitle)

$script:StatusLabel = New-Label 'Ready' 770 28 180 24
$script:StatusLabel.TextAlign = [System.Drawing.ContentAlignment]::MiddleRight
$header.Controls.Add($script:StatusLabel)

$tabs = New-Object System.Windows.Forms.TabControl
$tabs.Dock = [System.Windows.Forms.DockStyle]::Fill
$tabs.Padding = New-Object System.Drawing.Point(15, 6)
$tabs.Font = $script:FontRegular
$tabs.BackColor = $script:Colors.Background
$script:MainForm.Controls.Add($tabs)

$downloadTab = New-Object System.Windows.Forms.TabPage
$downloadTab.Text = '  Downloader & Extractor  '
$downloadTab.BackColor = $script:Colors.Background
$downloadTab.ForeColor = $script:Colors.Foreground
$tabs.TabPages.Add($downloadTab)

$taskTab = New-Object System.Windows.Forms.TabPage
$taskTab.Text = '  Mini Task Manager  '
$taskTab.BackColor = $script:Colors.Background
$taskTab.ForeColor = $script:Colors.Foreground
$tabs.TabPages.Add($taskTab)

# ------------------------------------------------------------
# Downloader tab
# ------------------------------------------------------------

$downloadPanel = New-Object System.Windows.Forms.Panel
$downloadPanel.Dock = [System.Windows.Forms.DockStyle]::Fill
$downloadPanel.AutoScroll = $true
$downloadPanel.BackColor = $script:Colors.Background
$downloadTab.Controls.Add($downloadPanel)

$downloadPanel.Controls.Add((New-Label 'Download source' 22 18 220 24))

$script:UrlBox = New-TextBox $script:DefaultUrl 22 45 850
$script:UrlBox.Anchor = 'Top, Left, Right'
$downloadPanel.Controls.Add($script:UrlBox)

$downloadPanel.Controls.Add((New-Label 'Save directory' 22 88 220 24))

$script:DirectoryBox = New-TextBox $defaultDirectory 22 115 700
$script:DirectoryBox.Anchor = 'Top, Left, Right'
$downloadPanel.Controls.Add($script:DirectoryBox)

$browseButton = New-Button 'Browse...' 740 113 130 34 $script:Colors.Input
$browseButton.Anchor = 'Top, Right'
$downloadPanel.Controls.Add($browseButton)

$browseButton.Add_Click({
    try {
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $dialog.Description = 'Select the download and extraction directory'
        $dialog.ShowNewFolderButton = $true

        if (Test-Path -LiteralPath $script:DirectoryBox.Text) {
            $dialog.SelectedPath = $script:DirectoryBox.Text
        }

        if ($dialog.ShowDialog($script:MainForm) -eq
            [System.Windows.Forms.DialogResult]::OK) {
            $script:DirectoryBox.Text = $dialog.SelectedPath
            Write-Log "Target directory set to $($dialog.SelectedPath)"
        }
    } catch {
        Show-AppError $_.Exception.Message 'Folder selection failed'
    }
})

$script:StartButton = New-Button 'Start Download' 22 165 155 40 $script:Colors.Accent
$downloadPanel.Controls.Add($script:StartButton)

$script:CancelButton = New-Button 'Cancel Download' 187 165 155 40 $script:Colors.Red
$script:CancelButton.Enabled = $false
$downloadPanel.Controls.Add($script:CancelButton)

$script:ExtractButton = New-Button 'Extract Archive' 352 165 155 40 $script:Colors.Green
$downloadPanel.Controls.Add($script:ExtractButton)

$openFolderButton = New-Button 'Open Folder' 517 165 130 40 $script:Colors.Input
$downloadPanel.Controls.Add($openFolderButton)

$clearLogButton = New-Button 'Clear Log' 657 165 100 40 $script:Colors.Input
$clearLogButton.Anchor = 'Top, Right'
$downloadPanel.Controls.Add($clearLogButton)

$openFolderButton.Add_Click({
    try {
        $path = $script:DirectoryBox.Text.Trim()

        if ([string]::IsNullOrWhiteSpace($path)) {
            throw 'Enter a target directory first.'
        }

        if (-not (Test-Path -LiteralPath $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        }

        Start-Process -FilePath explorer.exe -ArgumentList @($path)
    } catch {
        Show-AppError $_.Exception.Message 'Could not open folder'
    }
})

$clearLogButton.Add_Click({
    $script:LogBox.Clear()
    Write-Log 'Log cleared'
})

$script:ProgressBar = New-Object System.Windows.Forms.ProgressBar
$script:ProgressBar.Location = New-Object System.Drawing.Point(22, 228)
$script:ProgressBar.Size = New-Object System.Drawing.Size(850, 23)
$script:ProgressBar.Anchor = 'Top, Left, Right'
$script:ProgressBar.Minimum = 0
$script:ProgressBar.Maximum = 100
$script:ProgressBar.Style = [System.Windows.Forms.ProgressBarStyle]::Continuous
$downloadPanel.Controls.Add($script:ProgressBar)

$script:ProgressLabel = New-Label '0%  |  Waiting for a download' 22 257 850 23
$script:ProgressLabel.Anchor = 'Top, Left, Right'
$script:ProgressLabel.ForeColor = $script:Colors.Muted
$downloadPanel.Controls.Add($script:ProgressLabel)

$downloadPanel.Controls.Add((New-Label 'Live Activity Log' 22 291 250 25))

$script:LogBox = New-Object System.Windows.Forms.RichTextBox
$script:LogBox.Location = New-Object System.Drawing.Point(22, 319)
$script:LogBox.Size = New-Object System.Drawing.Size(850, 280)
$script:LogBox.Anchor = 'Top, Bottom, Left, Right'
$script:LogBox.ReadOnly = $true
$script:LogBox.BackColor = [System.Drawing.Color]::FromArgb(18, 20, 25)
$script:LogBox.ForeColor = $script:Colors.Foreground
$script:LogBox.BorderStyle = [System.Windows.Forms.BorderStyle]::FixedSingle
$script:LogBox.Font = New-Object System.Drawing.Font('Consolas', 9)
$script:LogBox.DetectUrls = $true
$downloadPanel.Controls.Add($script:LogBox)

$script:DownloadInfoLabel = New-Label 'No active download' 22 607 850 24
$script:DownloadInfoLabel.Anchor = 'Bottom, Left, Right'
$script:DownloadInfoLabel.ForeColor = $script:Colors.Muted
$downloadPanel.Controls.Add($script:DownloadInfoLabel)

Write-Log 'Application initialized'
Write-Log 'Enter a URL, select a folder, and press Start Download'

# ------------------------------------------------------------
# Download engine
# WebClient callbacks are asynchronous; UI updates are marshalled
# back to the Windows Forms thread using BeginInvoke.
# ------------------------------------------------------------

$script:DownloadClient = New-Object System.Net.WebClient
$script:DownloadClient.Headers.Add('User-Agent', 'PowerShellUltimateHub/1.0')

$script:DownloadClient.add_DownloadProgressChanged({
    param($sender, $eventArgs)

    try {
        if ($script:MainForm.IsDisposed) {
            return
        }

        $percent = [Math]::Max(0, [Math]::Min(100, $eventArgs.ProgressPercentage))
        $received = [long]$eventArgs.BytesReceived
        $total = [long]$eventArgs.TotalBytesToReceive

        $script:MainForm.BeginInvoke([Action]{
            try {
                $script:ProgressBar.Value = $percent

                if ($total -gt 0) {
                    $script:ProgressLabel.Text = '{0}%  |  {1} / {2}' -f
                        $percent, (Format-Bytes $received), (Format-Bytes $total)
                } else {
                    $script:ProgressLabel.Text = '{0}%  |  {1} downloaded' -f
                        $percent, (Format-Bytes $received)
                }

                $script:DownloadInfoLabel.Text = 'Downloading... ' + $script:ProgressLabel.Text
            } catch {
                # Ignore transient UI updates during shutdown.
            }
        }) | Out-Null
    } catch {
        # The window may have closed during a callback.
    }
})

$script:DownloadClient.add_DownloadFileCompleted({
    param($sender, $eventArgs)

    try {
        if ($script:MainForm.IsDisposed) {
            return
        }

        $cancelled = $eventArgs.Cancelled
        $errorText = $null

        if ($null -ne $eventArgs.Error) {
            $errorText = $eventArgs.Error.Message
        }

        $script:MainForm.BeginInvoke([Action]{
            try {
                $script:DownloadStarted = $false
                $script:StartButton.Enabled = $true
                $script:CancelButton.Enabled = $false
                $script:UrlBox.Enabled = $true
                $script:DirectoryBox.Enabled = $true
                $script:StatusLabel.Text = 'Ready'

                if ($cancelled) {
                    $script:DownloadCancelled = $true
                    $script:ProgressLabel.Text = 'Download cancelled'
                    $script:DownloadInfoLabel.Text = 'The download was cancelled.'
                    Write-Log 'Download cancelled by user' 'WARNING'

                    if ($script:CurrentDownloadPath -and
                        (Test-Path -LiteralPath $script:CurrentDownloadPath)) {
                        try {
                            Remove-Item -LiteralPath $script:CurrentDownloadPath -Force
                            Write-Log 'Removed incomplete download file'
                        } catch {
                            Write-Log "Could not remove incomplete file: $($_.Exception.Message)" 'WARNING'
                        }
                    }

                    return
                }

                if ($errorText) {
                    $script:ProgressLabel.Text = 'Download failed'
                    $script:DownloadInfoLabel.Text = $errorText
                    Write-Log "Download failed: $errorText" 'ERROR'
                    Show-AppError $errorText 'Download failed'
                    return
                }

                $script:DownloadCompleted = $true
                $script:ProgressBar.Value = 100
                $script:ProgressLabel.Text = '100%  |  Download complete'
                $script:DownloadInfoLabel.Text = "Saved to: $($script:CurrentDownloadPath)"
                $script:StatusLabel.Text = 'Download complete'
                Write-Log "Download complete: $($script:CurrentDownloadPath)" 'SUCCESS'
            } catch {
                Write-Log "Completion handler error: $($_.Exception.Message)" 'ERROR'
            }
        }) | Out-Null
    } catch {
        # The application is closing.
    }
})

$script:StartButton.Add_Click({
    try {
        if ($script:DownloadStarted) {
            return
        }

        $url = $script:UrlBox.Text.Trim()
        $directory = $script:DirectoryBox.Text.Trim()

        if ([string]::IsNullOrWhiteSpace($url)) {
            throw 'Enter a download URL.'
        }

        $parsedUri = $null
        if (-not [System.Uri]::TryCreate(
            $url,
            [System.UriKind]::Absolute,
            [ref]$parsedUri
        )) {
            throw 'The download URL is not valid.'
        }

        if ($parsedUri.Scheme -notin @('http', 'https')) {
            throw 'Only HTTP and HTTPS download URLs are supported.'
        }

        if ([string]::IsNullOrWhiteSpace($directory)) {
            throw 'Choose a target directory.'
        }

        if (-not (Test-Path -LiteralPath $directory)) {
            New-Item -ItemType Directory -Path $directory -Force | Out-Null
        }

        $fileName = [System.IO.Path]::GetFileName($parsedUri.AbsolutePath)

        if ([string]::IsNullOrWhiteSpace($fileName)) {
            $fileName = 'download.bin'
        }

        # Decode ordinary URL-encoded filenames.
        try {
            $fileName = [System.Uri]::UnescapeDataString($fileName)
        } catch {}

        # Prevent a URL from selecting a path outside the chosen directory.
        $fileName = [System.IO.Path]::GetFileName($fileName)

        if ([string]::IsNullOrWhiteSpace($fileName) -or
            $fileName -in @('.', '..')) {
            throw 'Could not determine a safe filename from the URL.'
        }

        $targetPath = Join-Path $directory $fileName

        if (Test-Path -LiteralPath $targetPath) {
            $answer = [System.Windows.Forms.MessageBox]::Show(
                $script:MainForm,
                "The file already exists:`r`n$targetPath`r`n`r`nOverwrite it?",
                'Confirm overwrite',
                [System.Windows.Forms.MessageBoxButtons]::YesNo,
                [System.Windows.Forms.MessageBoxIcon]::Question
            )

            if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) {
                Write-Log 'Download skipped; existing file was preserved' 'WARNING'
                return
            }

            Remove-Item -LiteralPath $targetPath -Force
        }

        $script:CurrentDownloadPath = $targetPath
        $script:DownloadStarted = $true
        $script:DownloadCompleted = $false
        $script:DownloadCancelled = $false

        $script:ProgressBar.Value = 0
        $script:ProgressLabel.Text = '0%  |  Connecting...'
        $script:DownloadInfoLabel.Text = "Saving to: $targetPath"
        $script:StatusLabel.Text = 'Downloading...'
        $script:StartButton.Enabled = $false
        $script:CancelButton.Enabled = $true
        $script:UrlBox.Enabled = $false
        $script:DirectoryBox.Enabled = $false

        Write-Log "Starting download: $url"
        Write-Log "Destination: $targetPath"

        # DownloadFileAsync returns immediately and keeps the GUI responsive.
        $script:DownloadClient.DownloadFileAsync(
            $parsedUri,
            $targetPath
        )
    } catch {
        $script:DownloadStarted = $false
        $script:StartButton.Enabled = $true
        $script:CancelButton.Enabled = $false
        $script:UrlBox.Enabled = $true
        $script:DirectoryBox.Enabled = $true
        $script:StatusLabel.Text = 'Ready'
        Write-Log $_.Exception.Message 'ERROR'
        Show-AppError $_.Exception.Message 'Could not start download'
    }
})

$script:CancelButton.Add_Click({
    try {
        if ($script:DownloadStarted -and
            $script:DownloadClient.IsBusy) {
            $script:DownloadCancelled = $true
            $script:DownloadClient.CancelAsync()
            $script:CancelButton.Enabled = $false
            $script:ProgressLabel.Text = 'Cancelling...'
            Write-Log 'Cancellation requested...' 'WARNING'
        }
    } catch {
        Write-Log "Could not cancel download: $($_.Exception.Message)" 'ERROR'
        Show-AppError $_.Exception.Message 'Cancellation failed'
    }
})

# ------------------------------------------------------------
# Archive extractor
# Supports ZIP, TAR, TAR.GZ and TGZ.
# TAR extraction uses the Windows tar.exe utility.
# ZIP extraction uses Expand-Archive.
# ------------------------------------------------------------

function Get-ArchiveFiles {
    param([string]$Directory)

    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
        throw 'The target directory does not exist.'
    }

    $archives = @(
        Get-ChildItem -LiteralPath $Directory -File |
            Where-Object {
                $_.Name -match '(?i)\.zip$|\.tar\.gz$|\.tgz$|\.tar$'
            } |
            Sort-Object Name
    )

    return $archives
}

function Expand-SelectedArchive {
    param(
        [System.IO.FileInfo]$Archive,
        [string]$Destination
    )

    if ($null -eq $Archive -or
        -not (Test-Path -LiteralPath $Archive.FullName -PathType Leaf)) {
        throw 'The selected archive file no longer exists.'
    }

    $name = $Archive.Name

    if ($name -match '(?i)\.tar\.gz$') {
        $folderName = $name -replace '(?i)\.tar\.gz$', ''
    } elseif ($name -match '(?i)\.tgz$') {
        $folderName = $name -replace '(?i)\.tgz$', ''
    } else {
        $folderName = [System.IO.Path]::GetFileNameWithoutExtension($name)
    }

    if ([string]::IsNullOrWhiteSpace($folderName)) {
        $folderName = 'Extracted'
    }

    $extractPath = Join-Path $Destination $folderName

    if (Test-Path -LiteralPath $extractPath) {
        $extractPath = Join-Path $Destination (
            '{0}_{1}' -f $folderName, (Get-Date -Format 'yyyyMMdd_HHmmss')
        )
    }

    New-Item -ItemType Directory -Path $extractPath -Force | Out-Null

    try {
        if ($name -match '(?i)\.zip$') {
            Expand-Archive -LiteralPath $Archive.FullName `
                -DestinationPath $extractPath -Force -ErrorAction Stop
        } elseif ($name -match '(?i)\.(tar\.gz|tgz|tar)$') {
            $tarCommand = Get-Command 'tar.exe' -ErrorAction SilentlyContinue

            if ($null -eq $tarCommand) {
                throw 'tar.exe was not found. Install a Windows version that includes tar, or use a ZIP archive.'
            }

            # Use the native process API to avoid shell interpretation of paths.
            $startInfo = New-Object System.Diagnostics.ProcessStartInfo
            $startInfo.FileName = $tarCommand.Source
            $startInfo.Arguments = '-xf "{0}" -C "{1}"' -f `
                $Archive.FullName.Replace('"', '\"'), `
                $extractPath.Replace('"', '\"')
            $startInfo.UseShellExecute = $false
            $startInfo.CreateNoWindow = $true
            $startInfo.RedirectStandardOutput = $true
            $startInfo.RedirectStandardError = $true

            $process = New-Object System.Diagnostics.Process
            $process.StartInfo = $startInfo

            if (-not $process.Start()) {
                throw 'Could not launch tar.exe.'
            }

            $stdoutTask = $process.StandardOutput.ReadToEndAsync()
            $stderrTask = $process.StandardError.ReadToEndAsync()
            $process.WaitForExit()

            $stdout = $stdoutTask.GetAwaiter().GetResult()
            $stderr = $stderrTask.GetAwaiter().GetResult()

            if ($process.ExitCode -ne 0) {
                throw "tar.exe failed (exit $($process.ExitCode)): $stderr"
            }

            if ($stdout) {
                Write-Log $stdout.Trim()
            }
        } else {
            throw "Unsupported archive format: $name"
        }

        $items = @(Get-ChildItem -LiteralPath $extractPath -Force)
        Write-Log "Extracted $name to $extractPath" 'SUCCESS'
        Write-Log "Extracted top-level entries: $($items.Count)"

        return $extractPath
    } catch {
        Write-Log "Extraction failed: $($_.Exception.Message)" 'ERROR'

        # Keep an existing destination only if extraction produced content.
        try {
            $remaining = @(Get-ChildItem -LiteralPath $extractPath -Force)
            if ($remaining.Count -eq 0) {
                Remove-Item -LiteralPath $extractPath -Force
            }
        } catch {}

        throw
    }
}

$script:ExtractButton.Add_Click({
    try {
        if ($script:DownloadStarted) {
            throw 'Wait for the active download to finish before extracting.'
        }

        $directory = $script:DirectoryBox.Text.Trim()

        if ([string]::IsNullOrWhiteSpace($directory)) {
            throw 'Choose a target directory.'
        }

        $archives = @(Get-ArchiveFiles -Directory $directory)

        if ($archives.Count -eq 0) {
            throw 'No ZIP, TAR, TAR.GZ, or TGZ archives were found in the target directory.'
        }

        $selectedArchive = $null

        if ($archives.Count -eq 1) {
            $selectedArchive = $archives[0]
        } else {
            $chooser = New-Object System.Windows.Forms.Form
            $chooser.Text = 'Choose an archive'
            $chooser.Size = New-Object System.Drawing.Size(540, 180)
            $chooser.StartPosition = 'CenterParent'
            $chooser.BackColor = $script:Colors.Background
            $chooser.ForeColor = $script:Colors.Foreground
            $chooser.FormBorderStyle = 'FixedDialog'
            $chooser.MaximizeBox = $false
            $chooser.MinimizeBox = $false

            $combo = New-Object System.Windows.Forms.ComboBox
            $combo.Location = New-Object System.Drawing.Point(18, 20)
            $combo.Size = New-Object System.Drawing.Size(485, 30)
            $combo.DropDownStyle = 'DropDownList'
            $combo.BackColor = $script:Colors.Input
            $combo.ForeColor = $script:Colors.Foreground

            foreach ($archive in $archives) {
                [void]$combo.Items.Add($archive.Name)
            }

            $combo.SelectedIndex = 0
            $chooser.Controls.Add($combo)

            $okButton = New-Button 'Extract' 265 72 110 35 $script:Colors.Green
            $okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
            $chooser.Controls.Add($okButton)

            $closeButton = New-Button 'Cancel' 385 72 110 35 $script:Colors.Input
            $closeButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
            $chooser.Controls.Add($closeButton)

            $chooser.AcceptButton = $okButton
            $chooser.CancelButton = $closeButton

            if ($chooser.ShowDialog($script:MainForm) -ne
                [System.Windows.Forms.DialogResult]::OK) {
                $chooser.Dispose()
                return
            }

            $selectedArchive = $archives[$combo.SelectedIndex]
            $chooser.Dispose()
        }

        Write-Log "Preparing to extract: $($selectedArchive.Name)"
        $script:StatusLabel.Text = 'Extracting...'

        $extractPath = Expand-SelectedArchive `
            -Archive $selectedArchive `
            -Destination $directory

        $script:StatusLabel.Text = 'Ready'

        $answer = [System.Windows.Forms.MessageBox]::Show(
            $script:MainForm,
            "Extraction completed successfully.`r`n`r`nLocation:`r`n$extractPath`r`n`r`nOpen the extracted folder?",
            'Extraction complete',
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Information
        )

        if ($answer -eq [System.Windows.Forms.DialogResult]::Yes) {
            Start-Process -FilePath explorer.exe -ArgumentList @($extractPath)
        }
    } catch {
        $script:StatusLabel.Text = 'Ready'
        Write-Log $_.Exception.Message 'ERROR'
        Show-AppError $_.Exception.Message 'Extraction failed'
    }
})

# ------------------------------------------------------------
# Mini Task Manager
# ------------------------------------------------------------

$taskPanel = New-Object System.Windows.Forms.Panel
$taskPanel.Dock = [System.Windows.Forms.DockStyle]::Fill
$taskPanel.BackColor = $script:Colors.Background
$taskTab.Controls.Add($taskPanel)

$taskPanel.Controls.Add((New-Label 'Running Processes' 20 18 300 28))

$script:ProcessSummary = New-Label 'Refresh to load process information.' 20 47 800 24
$script:ProcessSummary.ForeColor = $script:Colors.Muted
$taskPanel.Controls.Add($script:ProcessSummary)

$script:ProcessList = New-Object System.Windows.Forms.ListView
$script:ProcessList.Location = New-Object System.Drawing.Point(20, 80)
$script:ProcessList.Size = New-Object System.Drawing.Size(900, 490)
$script:ProcessList.Anchor = 'Top, Bottom, Left, Right'
$script:ProcessList.View = [System.Windows.Forms.View]::Details
$script:ProcessList.FullRowSelect = $true
$script:ProcessList.GridLines = $true
$script:ProcessList.MultiSelect = $false
$script:ProcessList.HideSelection = $false
$script:ProcessList.BackColor = $script:Colors.Panel
$script:ProcessList.ForeColor = $script:Colors.Foreground
$script:ProcessList.BorderStyle = 'FixedSingle'

[void]$script:ProcessList.Columns.Add('Process Name', 330)
[void]$script:ProcessList.Columns.Add('PID', 90)
[void]$script:ProcessList.Columns.Add('CPU (s)', 130)
[void]$script:ProcessList.Columns.Add('Memory (MB)', 150)

$taskPanel.Controls.Add($script:ProcessList)

$refreshButton = New-Button 'Refresh Processes' 20 590 160 40 $script:Colors.Accent
$refreshButton.Anchor = 'Bottom, Left'
$taskPanel.Controls.Add($refreshButton)

$script:EndTaskButton = New-Button 'End Selected Task' 190 590 160 40 $script:Colors.Red
$script:EndTaskButton.Anchor = 'Bottom, Left'
$taskPanel.Controls.Add($script:EndTaskButton)

$script:AutoRefreshCheck = New-Object System.Windows.Forms.CheckBox
$script:AutoRefreshCheck.Text = 'Auto-refresh every 5 seconds'
$script:AutoRefreshCheck.Location = New-Object System.Drawing.Point(370, 598)
$script:AutoRefreshCheck.Size = New-Object System.Drawing.Size(250, 25)
$script:AutoRefreshCheck.ForeColor = $script:Colors.Foreground
$script:AutoRefreshCheck.BackColor = [System.Drawing.Color]::Transparent
$script:AutoRefreshCheck.Checked = $false
$taskPanel.Controls.Add($script:AutoRefreshCheck)

function Update-ProcessList {
    try {
        $selectedPid = $null

        if ($script:ProcessList.SelectedItems.Count -gt 0) {
            $selectedPid = [int]$script:ProcessList.SelectedItems[0].SubItems[1].Text
        }

        $processes = @(
            Get-Process -ErrorAction SilentlyContinue |
                Sort-Object WorkingSet64 -Descending |
                Select-Object -First 150
        )

        $script:ProcessList.BeginUpdate()
        $script:ProcessList.Items.Clear()

        foreach ($process in $processes) {
            try {
                $pidText = [string]$process.Id
                $cpuText = if ($null -ne $process.CPU) {
                    '{0:N1}' -f $process.CPU
                } else {
                    'N/A'
                }

                $memoryText = '{0:N1}' -f ($process.WorkingSet64 / 1MB)

                $item = New-Object System.Windows.Forms.ListViewItem(
                    [string]$process.ProcessName
                )

                [void]$item.SubItems.Add($pidText)
                [void]$item.SubItems.Add($cpuText)
                [void]$item.SubItems.Add($memoryText)

                $item.Tag = [int]$process.Id

                if ($selectedPid -and $process.Id -eq $selectedPid) {
                    $item.Selected = $true
                }

                [void]$script:ProcessList.Items.Add($item)
            } catch {
                # Some processes exit or deny access while being enumerated.
            }
        }

        $script:ProcessList.EndUpdate()
        $script:LastProcessRefresh = Get-Date
        $script:ProcessSummary.Text = (
            '{0} processes shown  |  Updated {1}' -f
            $script:ProcessList.Items.Count,
            $script:LastProcessRefresh.ToString('HH:mm:ss')
        )

        Write-Log "Process list refreshed ($($script:ProcessList.Items.Count) entries)"
    } catch {
        try {
            $script:ProcessList.EndUpdate()
        } catch {}

        Write-Log "Could not refresh processes: $($_.Exception.Message)" 'ERROR'
        Show-AppError $_.Exception.Message 'Process refresh failed'
    }
}

$refreshButton.Add_Click({
    Update-ProcessList
})

$script:EndTaskButton.Add_Click({
    try {
        if ($script:ProcessList.SelectedItems.Count -eq 0) {
            throw 'Select a process from the list first.'
        }

        $item = $script:ProcessList.SelectedItems[0]
        $processId = [int]$item.SubItems[1].Text
        $processName = $item.Text

        # Protect this application and essential Windows processes.
        if ($processId -eq $PID) {
            throw 'The application cannot terminate its own PowerShell process.'
        }

        $protectedNames = @(
            'System', 'Idle', 'Registry', 'smss', 'csrss',
            'wininit', 'winlogon', 'services', 'lsass',
            'svchost', 'fontdrvhost', 'dwm'
        )

        if ($protectedNames -contains $processName) {
            throw "Ending the system process '$processName' is blocked for safety."
        }

        $answer = [System.Windows.Forms.MessageBox]::Show(
            $script:MainForm,
            "End this process?`r`n`r`nName: $processName`r`nPID: $processId`r`n`r`nUnsaved work in that process may be lost.",
            'Confirm End Task',
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        )

        if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) {
            return
        }

        $targetProcess = Get-Process -Id $processId -ErrorAction Stop

        # Use the PID captured from the selected row, not user-entered commands.
        Stop-Process -Id $targetProcess.Id -Force -ErrorAction Stop

        Write-Log "End Task requested for $processName (PID $processId)" 'WARNING'
        $script:ProcessSummary.Text = "Termination requested: $processName ($processId)"

        # Give Windows a moment to remove the process before refreshing.
        $script:MainForm.BeginInvoke([Action]{
            try {
                Update-ProcessList
            } catch {
                Write-Log $_.Exception.Message 'ERROR'
            }
        }) | Out-Null
    } catch {
        Write-Log "End Task failed: $($_.Exception.Message)" 'ERROR'
        Show-AppError $_.Exception.Message 'Could not end task'
    }
})

$tabs.Add_SelectedIndexChanged({
    try {
        if ($tabs.SelectedTab -eq $taskTab) {
            Update-ProcessList
        }
    } catch {
        Write-Log "Tab refresh failed: $($_.Exception.Message)" 'ERROR'
    }
})

# Optional process auto-refresh timer.
$script:ProcessTimer = New-Object System.Windows.Forms.Timer
$script:ProcessTimer.Interval = 5000
$script:ProcessTimer.Add_Tick({
    try {
        if ($script:AutoRefreshCheck.Checked -and
            $tabs.SelectedTab -eq $taskTab) {
            Update-ProcessList
        }
    } catch {
        Write-Log "Automatic process refresh failed: $($_.Exception.Message)" 'ERROR'
    }
})
$script:ProcessTimer.Start()

# ------------------------------------------------------------
# Keyboard shortcuts
# Ctrl+L: clear log
# F5: refresh process list on the task manager tab
# ------------------------------------------------------------

$script:MainForm.Add_KeyDown({
    param($sender, $eventArgs)

    try {
        if ($eventArgs.Control -and $eventArgs.KeyCode -eq
            [System.Windows.Forms.Keys]::L) {
            $script:LogBox.Clear()
            Write-Log 'Log cleared'
            $eventArgs.Handled = $true
        } elseif ($eventArgs.KeyCode -eq [System.Windows.Forms.Keys]::F5) {
            if ($tabs.SelectedTab -eq $taskTab) {
                Update-ProcessList
            }
            $eventArgs.Handled = $true
        }
    } catch {
        Write-Log $_.Exception.Message 'ERROR'
    }
})

# ------------------------------------------------------------
# Shutdown handling
# ------------------------------------------------------------

$script:MainForm.Add_FormClosing({
    param($sender, $eventArgs)

    try {
        if ($script:DownloadStarted -and $script:DownloadClient.IsBusy) {
            $answer = [System.Windows.Forms.MessageBox]::Show(
                $script:MainForm,
                'A download is in progress. Close the application and cancel it?',
                'Download in progress',
                [System.Windows.Forms.MessageBoxButtons]::YesNo,
                [System.Windows.Forms.MessageBoxIcon]::Warning
            )

            if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) {
                $eventArgs.Cancel = $true
                return
            }

            $script:DownloadClient.CancelAsync()
        }

        if ($script:ProcessTimer) {
            $script:ProcessTimer.Stop()
            $script:ProcessTimer.Dispose()
        }

        if ($script:DownloadClient) {
            $script:DownloadClient.Dispose()
        }

        if ($script:FontRegular) {
            $script:FontRegular.Dispose()
        }

        if ($script:FontBold) {
            $script:FontBold.Dispose()
        }

        if ($script:FontTitle) {
            $script:FontTitle.Dispose()
        }
    } catch {
        # Do not prevent the application from closing during cleanup.
    }
})

# ------------------------------------------------------------
# Run
# ------------------------------------------------------------

[void]$script:MainForm.ShowDialog()
