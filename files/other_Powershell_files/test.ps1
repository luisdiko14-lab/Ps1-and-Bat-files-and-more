
# ============================================
# FAKE SYSTEM HACK SIMULATION (SAFE PRANK)
# Author: Luis
# ============================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# -------------------------------
# GUI FORM
# -------------------------------
$form = New-Object System.Windows.Forms.Form
$form.Text = "SYSTEM BREACH DETECTED"
$form.Size = New-Object System.Drawing.Size(520, 300)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::Black
$form.TopMost = $true

# -------------------------------
# TITLE LABEL
# -------------------------------
$title = New-Object System.Windows.Forms.Label
$title.Text = "⚠ SYSTEM COMPROMISED ⚠"
$title.ForeColor = "Red"
$title.Font = New-Object System.Drawing.Font("Consolas", 18, [System.Drawing.FontStyle]::Bold)
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(90, 20)
$form.Controls.Add($title)

# -------------------------------
# STATUS LABEL
# -------------------------------
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Initializing breach sequence..."
$statusLabel.ForeColor = "Lime"
$statusLabel.Font = New-Object System.Drawing.Font("Consolas", 10)
$statusLabel.AutoSize = $true
$statusLabel.Location = New-Object System.Drawing.Point(40, 80)
$form.Controls.Add($statusLabel)

# -------------------------------
# PROGRESS BAR
# -------------------------------
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(40, 120)
$progressBar.Size = New-Object System.Drawing.Size(420, 25)
$progressBar.Minimum = 0
$progressBar.Maximum = 100
$form.Controls.Add($progressBar)

# -------------------------------
# OUTPUT FILE
# -------------------------------
$outputFile = "$env:USERPROFILE\Desktop\ENCRYPTED_FILED.x"

$fakeHeader = @"
====================================
!! WARNING !!
YOUR FILES HAVE BEEN ENCRYPTED
(This is a SIMULATION / FAKE PRANK)
====================================

No files were harmed.
This file only lists detected files.

"@

Set-Content -Path $outputFile -Value $fakeHeader -Encoding UTF8

# -------------------------------
# SAFE DIRECTORIES TO SCAN
# -------------------------------
$foldersToScan = @(
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Documents",
    "$env:USERPROFILE\Downloads"
)

# -------------------------------
# FAKE LOADING + FILE LISTING
# -------------------------------
$progress = 0

foreach ($folder in $foldersToScan) {
    if (Test-Path $folder) {

        $statusLabel.Text = "Scanning: $folder"
        $form.Refresh()

        Get-ChildItem -Path $folder -Recurse -ErrorAction SilentlyContinue | ForEach-Object {

            Add-Content -Path $outputFile -Value $_.FullName

            Start-Sleep -Milliseconds 15
            if ($progress -lt 100) {
                $progress += 1
                $progressBar.Value = $progress
            }

            $form.Refresh()
        }
    }
}

# -------------------------------
# FINAL FAKE MESSAGE
# -------------------------------
$statusLabel.Text = "Encryption complete. Files locked."
$progressBar.Value = 100
$form.Refresh()

Start-Sleep -Seconds 2

[System.Windows.Forms.MessageBox]::Show(
    "Your files have been encrypted.`n`n(Just kidding 😄)`nThis was a simulation.",
    "Operation Complete",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Warning
)

$form.Close()
