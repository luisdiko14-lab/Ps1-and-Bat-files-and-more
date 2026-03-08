# Check if the current session has Administrator privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsRole]::Administrator)

if (-not $isAdmin) {
    # If not admin, try to relaunch the script with 'runas' verb
    try {
        Start-Process powershell.exe -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"") -Verb RunAs -ErrorAction Stop
        exit
    }
    catch {
        # This block runs if the user selects "No" on the UAC prompt
        Write-Host "No" -ForegroundColor Red
        Pause
    }
}

# This part runs only if the script is successfully running as Admin
Write-Host "Yes" -ForegroundColor Green


# Robux GUI with System Tray & Background Notifications
# Save as Robux-GUI-Tray.ps1 and run in PowerShell (Windows)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Write-Host "Starting robux app"

# Desktop file path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$robuFile = Join-Path $desktopPath "ROBUX.txt"

# State flag for truly exiting
$script:reallyExit = $false

# -------------------------
# Build form
# -------------------------
$form = New-Object System.Windows.Forms.Form
$form.Text = "ROBUX Studio"
$form.Size = New-Object System.Drawing.Size(520,360)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false

# Title
$title = New-Object System.Windows.Forms.Label
$title.Text = "Robux Generator Interface (Simulation)"
$title.Font = New-Object System.Drawing.Font("Segoe UI",12,[System.Drawing.FontStyle]::Bold)
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(15,10)
$form.Controls.Add($title)

# Username label & box
$lblUser = New-Object System.Windows.Forms.Label
$lblUser.Text = "Username:"
$lblUser.Location = New-Object System.Drawing.Point(20,55)
$form.Controls.Add($lblUser)

$txtUser = New-Object System.Windows.Forms.TextBox
$txtUser.Size = New-Object System.Drawing.Size(300,23)
$txtUser.Location = New-Object System.Drawing.Point(110,50)
$form.Controls.Add($txtUser)

# Amount label & box
$lblAmount = New-Object System.Windows.Forms.Label
$lblAmount.Text = "Robux amount:"
$lblAmount.Location = New-Object System.Drawing.Point(20,90)
$form.Controls.Add($lblAmount)

$txtAmount = New-Object System.Windows.Forms.TextBox
$txtAmount.Size = New-Object System.Drawing.Size(150,23)
$txtAmount.Location = New-Object System.Drawing.Point(110,85)
$txtAmount.Text = "100"
$form.Controls.Add($txtAmount)

# Buttons
$btnStart = New-Object System.Windows.Forms.Button
$btnStart.Text = "Start"
$btnStart.Size = New-Object System.Drawing.Size(100,30)
$btnStart.Location = New-Object System.Drawing.Point(20,125)
$form.Controls.Add($btnStart)

$btnStop = New-Object System.Windows.Forms.Button
$btnStop.Text = "Stop"
$btnStop.Size = New-Object System.Drawing.Size(100,30)
$btnStop.Location = New-Object System.Drawing.Point(140,125)
$btnStop.Enabled = $false
$form.Controls.Add($btnStop)

# Progress bar (15 sec)
$progress = New-Object System.Windows.Forms.ProgressBar
$progress.Location = New-Object System.Drawing.Point(20,175)
$progress.Size = New-Object System.Drawing.Size(480,30)
$progress.Minimum = 0
$progress.Maximum = 15
$form.Controls.Add($progress)

# Status
$status = New-Object System.Windows.Forms.Label
$status.Text = "Waiting..."
$status.AutoSize = $true
$status.Location = New-Object System.Drawing.Point(20,210)
$form.Controls.Add($status)

# Log box
$log = New-Object System.Windows.Forms.TextBox
$log.Multiline = $true
$log.ScrollBars = "Vertical"
$log.ReadOnly = $true
$log.Size = New-Object System.Drawing.Size(480,80)
$log.Location = New-Object System.Drawing.Point(20,235)
$form.Controls.Add($log)

# -------------------------
# Timers
# -------------------------
# 15-second loading timer (1000ms tick)
$loadTimer = New-Object System.Windows.Forms.Timer
$loadTimer.Interval = 1000

# 67-second background writer
$bgTimer = New-Object System.Windows.Forms.Timer
$bgTimer.Interval = 100

# 3-second notification timer
$notifyTimer = New-Object System.Windows.Forms.Timer
$notifyTimer.Interval = 250

# Counter
$script:seconds = 20

# -------------------------
# System Tray (NotifyIcon & Context Menu)
# -------------------------
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$menuShow = New-Object System.Windows.Forms.ToolStripMenuItem
$menuShow.Text = "Show"
$contextMenu.Items.Add($menuShow) | Out-Null

$menuExit = New-Object System.Windows.Forms.ToolStripMenuItem
$menuExit.Text = "Exit"
$contextMenu.Items.Add($menuExit) | Out-Null

$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
# Use a simple system icon
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
$notifyIcon.Text = "ROBUX Studio (running)"
$notifyIcon.Visible = $true
$notifyIcon.ContextMenuStrip = $contextMenu

# Double-click / Show handler
$notifyIcon.add_DoubleClick({
    try {
        if (-not $form.Visible) {
            $form.Show()
            $form.WindowState = 'Normal'
            $form.BringToFront()
        } else {
            $form.WindowState = 'Normal'
            $form.BringToFront()
        }
    } catch {}
})

$menuShow.add_Click({
    try {
        if (-not $form.Visible) { $form.Show() }
        $form.WindowState = 'Normal'
        $form.BringToFront()
    } catch {}
})

# Exit handler: stop timers and allow form to close
$menuExit.add_Click({
    try {
        $log.AppendText("Exit requested from tray menu...`r`n")
        $script:reallyExit = $true
        # Stop timers to avoid further events while closing
        $loadTimer.Stop()
        $bgTimer.Stop()
        $notifyTimer.Stop()
        # dispose notify icon so balloon tips won't appear after exit
        $notifyIcon.Visible = $false
        $notifyIcon.Dispose()
        # Close the form to end application
        $form.Close()
    } catch {}
})

# -------------------------
# Helper: Append to file safely
# -------------------------
function Append-RbxLine {
    param($file, $username, $amount)
    try {
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        $line = "rbx=67 | user=$username | amount=$amount | time=$timestamp"
        Add-Content -Path $file -Value $line
        $log.AppendText("Appended to file at $timestamp`r`n")
    } catch {
        $log.AppendText("ERROR writing to $file : $($_.Exception.Message)`r`n")
    }
}

# -------------------------
# Start button click
# -------------------------
$btnStart.Add_Click({
    try {
        $username = $txtUser.Text.Trim()
        if ([string]::IsNullOrWhiteSpace($username)) { $username = "unknown_user" }

        $amount = $txtAmount.Text.Trim()
        if (-not ($amount -as [int])) { $amount = 0 }

        $btnStart.Enabled = $false
        $btnStop.Enabled = $true
        $txtUser.Enabled = $false
        $txtAmount.Enabled = $false

        $progress.Value = 0
        $script:seconds = 0
        $status.Text = "Loading... 15 seconds"

        # Create/overwrite file header
        $header = "user=$username`r`namount=$amount`r`ncreated=$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`r`n---`r`n"
        Set-Content -Path $robuFile -Value $header -ErrorAction Stop
        $log.AppendText("Created file: $robuFile`r`n")

        # start the 15-second load
        $loadTimer.Start()
    } catch {
        $log.AppendText("Start error: $($_.Exception.Message)`r`n")
    }
})

# -------------------------
# Load timer tick (15s)
# -------------------------
$loadTimer.Add_Tick({
    try {
        $script:seconds++
        if ($progress.Value -lt 15) {
            $progress.Value = [Math]::Min(15, $progress.Value + 1)
            $remaining = 15 - $script:seconds
            if ($remaining -lt 0) { $remaining = 0 }
            $status.Text = "Loading... $remaining seconds"
        }

        if ($script:seconds -ge 15) {
            $loadTimer.Stop()
            $status.Text = "Complete. Background writing & notifications started."
            $log.AppendText("Loading finished.`r`n")

            # write first append immediately (so there's content right away)
            $username = if ($txtUser.Text.Trim() -ne "") { $txtUser.Text.Trim() } else { "unknown_user" }
            $amount = if ($txtAmount.Text.Trim() -as [int]) { $txtAmount.Text.Trim() } else { 0 }
            Append-RbxLine -file $robuFile -username $username -amount $amount

            # start background writer (67s) and notification timer (3s)
            $bgTimer.Start()
            $notifyTimer.Start()
        }
    } catch {
        $log.AppendText("LoadTick error: $($_.Exception.Message)`r`n")
    }
})

# -------------------------
# Background writer (every 67s)
# -------------------------
$bgTimer.Add_Tick({
    try {
        $username = if ($txtUser.Text.Trim() -ne "") { $txtUser.Text.Trim() } else { "unknown_user" }
        $amount = if ($txtAmount.Text.Trim() -as [int]) { $txtAmount.Text.Trim() } else { 0 }
        Append-RbxLine -file $robuFile -username $username -amount $amount
    } catch {
        $log.AppendText("BgTick error: $($_.Exception.Message)`r`n")
    }
})

# -------------------------
# Notification timer (every 3s)
# -------------------------
$notifyTimer.Add_Tick({
    try {
        # Balloon tip (will appear from tray)
        if ($notifyIcon -ne $null) {
            $notifyIcon.ShowBalloonTip(2000, "Robux", "Your Robux is comming totally here!", [System.Windows.Forms.ToolTipIcon]::Error)
        }
        # Play a short system sound
        try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
        # Optional small log
        $log.AppendText("Notification shown at $(Get-Date -Format 'HH:mm:ss').`r`n")
        # Keep log from growing too big in long runs (trim)
        if ($log.Lines.Count -gt 200) {
            $lines = $log.Lines
            $keep = $lines | Select-Object -Last 150
            $log.Lines = $keep
        }
    } catch {
        $log.AppendText("NotifyTick error: $($_.Exception.Message)`r`n")
    }
})

# -------------------------
# Stop button
# -------------------------
$btnStop.Add_Click({
    try {
        $loadTimer.Stop()
        $bgTimer.Stop()
        $notifyTimer.Stop()

        $btnStart.Enabled = $true
        $btnStop.Enabled = $false
        $txtUser.Enabled = $true
        $txtAmount.Enabled = $true

        $status.Text = "Stopped."
        $log.AppendText("Process stopped by user.`r`n")
    } catch {
        $log.AppendText("Stop error: $($_.Exception.Message)`r`n")
    }
})

# -------------------------
# Form closing -> minimize to tray unless Exit chosen
# -------------------------
$form.add_FormClosing({
    param($sender, $e)
    try {
        if (-not $script:reallyExit) {
            # Prevent closing and hide instead (minimize to tray)
            $e.Cancel = $true
            $form.Hide()
            $notifyIcon.ShowBalloonTip(2000, "ROBUX Studio", "Application minimized to tray and will keep running.", [System.Windows.Forms.ToolTipIcon]::Warning)
        } else {
            # allowed to close: cleanup
            try {
                $loadTimer.Stop(); $bgTimer.Stop(); $notifyTimer.Stop()
            } catch {}
            if ($notifyIcon -ne $null) {
                $notifyIcon.Visible = $false
                $notifyIcon.Dispose()
            }
        }
    } catch {
        # If something goes wrong, still allow close
        $notifyIcon.Visible = $false
        $notifyIcon.Dispose()
    }
})

# Show the window and run
[void]$form.ShowDialog()
