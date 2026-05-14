# ================================
# OS Simulator Installer
# Creates all required files
# ================================

$BaseDir = "C:\App_Config_os"

Write-Host "Installing OS Simulator to $BaseDir..."

# Create base directory
if (!(Test-Path $BaseDir)) {
    New-Item -ItemType Directory -Path $BaseDir | Out-Null
}

# ----------------
# starter_booter.ps1
# ----------------
$StarterBooter = @'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "OS Simulator - Boot Loader"
$form.Size = New-Object System.Drawing.Size(500,300)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::Black

$label = New-Object System.Windows.Forms.Label
$label.Text = "Starting OS Simulator..."
$label.ForeColor = "Lime"
$label.Font = New-Object System.Drawing.Font("Consolas",14,[System.Drawing.FontStyle]::Bold)
$label.AutoSize = $true
$label.Location = New-Object System.Drawing.Point(110,80)

$progress = New-Object System.Windows.Forms.ProgressBar
$progress.Location = New-Object System.Drawing.Point(80,140)
$progress.Size = New-Object System.Drawing.Size(320,25)

$form.Controls.Add($label)
$form.Controls.Add($progress)

$form.Shown.Add({
    for ($i = 0; $i -le 100; $i += 5) {
        $progress.Value = $i
        Start-Sleep -Milliseconds 120
    }

    $form.Close()
    Start-Process powershell "-NoProfile -ExecutionPolicy Bypass -File `"$BaseDir\gui_setup.ps1`""
})

[System.Windows.Forms.Application]::Run($form)
'@

Set-Content -Path "$BaseDir\starter_booter.ps1" -Value $StarterBooter -Encoding UTF8

# ----------------
# gui_setup.ps1
# ----------------
$GuiSetup = @'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "Windows Setup"
$form.Size = New-Object System.Drawing.Size(700,400)
$form.StartPosition = "CenterScreen"

$title = New-Object System.Windows.Forms.Label
$title.Text = "Welcome to Windows Setup (Simulation)"
$title.Font = New-Object System.Drawing.Font("Segoe UI",16,[System.Drawing.FontStyle]::Bold)
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(30,30)

$btnNext = New-Object System.Windows.Forms.Button
$btnNext.Text = "Start Installation"
$btnNext.Size = New-Object System.Drawing.Size(200,40)
$btnNext.Location = New-Object System.Drawing.Point(30,100)

$progress = New-Object System.Windows.Forms.ProgressBar
$progress.Location = New-Object System.Drawing.Point(30,170)
$progress.Size = New-Object System.Drawing.Size(600,25)

$btnNext.Add_Click({
    for ($i = 0; $i -le 100; $i += 2) {
        $progress.Value = $i
        Start-Sleep -Milliseconds 80
        [System.Windows.Forms.Application]::DoEvents()
    }

    $form.Close()
    Start-Process powershell "-NoProfile -ExecutionPolicy Bypass -File `"$BaseDir\desktop.ps1`""
})

$form.Controls.Add($title)
$form.Controls.Add($btnNext)
$form.Controls.Add($progress)

[System.Windows.Forms.Application]::Run($form)
'@

Set-Content -Path "$BaseDir\gui_setup.ps1" -Value $GuiSetup -Encoding UTF8

# ----------------
# desktop.ps1
# ----------------
$Desktop = @'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "Windows Desktop (Simulation)"
$form.WindowState = "Maximized"
$form.BackColor = [System.Drawing.Color]::FromArgb(30,144,255)

$label = New-Object System.Windows.Forms.Label
$label.Text = "Welcome to Your Desktop"
$label.Font = New-Object System.Drawing.Font("Segoe UI",20,[System.Drawing.FontStyle]::Bold)
$label.AutoSize = $true
$label.Location = New-Object System.Drawing.Point(40,40)
$label.ForeColor = "White"

$btnShutdown = New-Object System.Windows.Forms.Button
$btnShutdown.Text = "Shutdown"
$btnShutdown.Size = New-Object System.Drawing.Size(150,40)
$btnShutdown.Location = New-Object System.Drawing.Point(40,120)

$btnShutdown.Add_Click({
    [System.Windows.Forms.MessageBox]::Show("Shutting down OS Simulator...")
    $form.Close()
})

$form.Controls.Add($label)
$form.Controls.Add($btnShutdown)

[System.Windows.Forms.Application]::Run($form)
'@

Set-Content -Path "$BaseDir\desktop.ps1" -Value $Desktop -Encoding UTF8

# ----------------
# config.json
# ----------------
$Config = @'
{
  "osName": "Windows Simulator",
  "version": "1.0",
  "installed": true,
  "installPath": "C:/App_Config_os"
}
'@

Set-Content -Path "$BaseDir\config.json" -Value $Config -Encoding UTF8

# ----------------
# Create launcher
# ----------------
$Launcher = @"
Start-Process powershell "-NoProfile -ExecutionPolicy Bypass -File `"$BaseDir\starter_booter.ps1`""
"@

Set-Content -Path "$BaseDir\launch_os.ps1" -Value $Launcher -Encoding UTF8

Write-Host "==================================="
Write-Host "OS Simulator Installed Successfully"
Write-Host "Path: $BaseDir"
Write-Host "Run: launch_os.ps1"
Write-Host "==================================="
