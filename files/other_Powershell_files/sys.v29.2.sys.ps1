<#
    ULTIMATE SYSTEM UTILITY v27.0 - BULLETPROOF EDITION
    ---------------------------------------------------
    - STABILITY: Added "Try/Catch" Safety Wrappers to prevent crashes.
    - DOWNLOADER: Targets 'luisdiko14-lab/Repo-1' (Tag: a)
    - NEW: Matrix Loading Effect & Public IP Tracker
    - NEW: Secure File Shredder & Uptime Monitor
#>

# ==============================================================================
# 1. SAFETY CHECK & ELEVATION
# ==============================================================================
$ErrorActionPreference = "SilentlyContinue"

# Auto-Elevate to Admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    try {
        Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        Exit
    } catch {
        [System.Windows.Forms.MessageBox]::Show("ERROR: Run as Administrator to use System Tools.")
        Break
    }
}

Add-Type -AssemblyName System.Windows.Forms, System.Drawing, System.IO.Compression.FileSystem

# --- PRE-BOOT CONFIG ---
$Global:BgColor = "#121212"
$Global:FgColor = "White"
$Global:AccColor = "Cyan"

# Theme Selection
$theme = [System.Windows.Forms.MessageBox]::Show("Enable Cyber-Dark Mode?", "System Utility v27.0", [System.Windows.Forms.MessageBoxButtons]::YesNoCancel, [System.Windows.Forms.MessageBoxIcon]::Question)
if ($theme -eq "Cancel") { Exit }
if ($theme -eq "No") { $Global:BgColor = "White"; $Global:FgColor = "Black"; $Global:AccColor = "Blue" }

# Download Confirm
$dlConfirm = [System.Windows.Forms.MessageBox]::Show("Download latest tools from GitHub (v27.0)?", "Update Check", [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Information)
if ($dlConfirm -eq "No") { Exit }

# Setup Paths
$Global:RepoDir = "C:\Users\$env:USERNAME\Downloads\USU_Repo_Download"
if (-not (Test-Path $Global:RepoDir)) { New-Item -Path $Global:RepoDir -ItemType Directory -Force | Out-Null }

# ==============================================================================
# 2. PHASE 1: SAFE DOWNLOADER (Non-Crashing)
# ==============================================================================
$dlForm = New-Object System.Windows.Forms.Form
$dlForm.Size = "600,350"; $dlForm.StartPosition = "CenterScreen"; $dlForm.FormBorderStyle = "None"; $dlForm.BackColor = $Global:BgColor

$lblD = New-Object System.Windows.Forms.Label; $lblD.Text = "ESTABLISHING SECURE CONNECTION..."; $lblD.ForeColor = $Global:AccColor; $lblD.Font = "Segoe UI, 12, style=Bold"; $lblD.Location = "20,20"; $lblD.AutoSize = $true
$txtLog = New-Object System.Windows.Forms.TextBox; $txtLog.Location = "20,60"; $txtLog.Size = "560,250"; $txtLog.Multiline = $true; $txtLog.BackColor = "Black"; $txtLog.ForeColor = "Lime"; $txtLog.Font = "Consolas, 9"; $txtLog.ReadOnly = $true

$dlForm.Controls.AddRange(@($lblD, $txtLog))
$dlForm.Show(); $dlForm.Refresh()

$url = "https://github.com/luisdiko14-lab/Repo-1/archive/refs/tags/a.zip"
$zipFile = "$Global:RepoDir\update.zip"
$extractPath = "$Global:RepoDir\extracted"

# Safe Download Logic
$txtLog.AppendText("[INIT] Resolving: $url`r`n"); $dlForm.Refresh()
try {
    # 1. Download
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $zipFile -ErrorAction Stop
    $txtLog.AppendText("[SUCCESS] Data packet received.`r`n"); $dlForm.Refresh()
    
    # 2. Verify Size
    if ((Get-Item $zipFile).Length -lt 1000) { throw "File too small (Corrupt Download)" }

    # 3. Extract
    $txtLog.AppendText("[IO] Extracting payload... "); $dlForm.Refresh()
    if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
    Expand-Archive -Path $zipFile -DestinationPath $extractPath -Force -ErrorAction Stop
    
    $txtLog.AppendText("DONE.`r`n[READY] Repo mounted at: $extractPath`r`n"); $dlForm.Refresh()
    Start-Sleep -Seconds 1
} catch {
    $txtLog.AppendText("`r`n[ERROR] Connection Failed or Bad ZIP.`r`nDetails: $($_.Exception.Message)`r`n[SAFE MODE] Skipping download phase...`r`n")
    $dlForm.Refresh(); Start-Sleep -Seconds 2
}
$dlForm.Close()

# ==============================================================================
# 3. PHASE 2: MATRIX LOADER (Visuals)
# ==============================================================================
$splash = New-Object System.Windows.Forms.Form
$splash.Size = "600,400"; $splash.StartPosition = "CenterScreen"; $splash.FormBorderStyle = "None"; $splash.BackColor = "Black"

# Avatar
$avatar = New-Object System.Windows.Forms.PictureBox
try { $avatar.ImageLocation = "https://avatars.githubusercontent.com/u/218044862?v=4" } catch {}
$avatar.SizeMode = "Zoom"; $avatar.Size = "100,100"; $avatar.Location = "250,30"
$splash.Controls.Add($avatar)

$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "UTILITY v27.0"; $lblTitle.ForeColor = $Global:AccColor; $lblTitle.Font = "Segoe UI, 20, style=Bold"; $lblTitle.Location = "190,150"; $lblTitle.AutoSize = $true

$lblStatus = New-Object System.Windows.Forms.Label; $lblStatus.Text = "Initializing..."; $lblStatus.ForeColor = "White"; $lblStatus.Location = "50,220"; $lblStatus.Size = "500,30"; $lblStatus.TextAlign = "MiddleCenter"
$pb = New-Object System.Windows.Forms.ProgressBar; $pb.Location = "50,260"; $pb.Size = "500,20"; $pb.Style = "Continuous"

$splash.Controls.AddRange(@($lblTitle, $lblStatus, $pb))
$splash.Show(); $splash.Refresh()

# Safe Hardware Detection (Prevents WMI Crashes)
$steps = @("Decrypting Config", "Mounting Drives", "Scanning CPU", "Scanning GPU", "Analysing RAM", "Checking Network", "Loading Interface")
for ($i=0; $i -lt $steps.Count; $i++) {
    $lblStatus.Text = $steps[$i] + "..."
    $pb.Value = [math]::Round((($i+1)/$steps.Count)*100)
    
    switch ($i) {
        2 { try { $Global:Cpu = (Get-CimInstance Win32_Processor).Name } catch { $Global:Cpu = "Unknown CPU" } }
        3 { try { $Global:Gpu = (Get-CimInstance Win32_VideoController).Name } catch { $Global:Gpu = "Unknown GPU" } }
        4 { try { $Global:Ram = [math]::Round((Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1MB, 1) } catch { $Global:Ram = "0" } }
        5 { try { $Global:IP = (Invoke-RestMethod "http://ipinfo.io/json").ip } catch { $Global:IP = "Offline" } }
    }
    $splash.Refresh(); Start-Sleep -Milliseconds 400
}
$splash.Close()

# ==============================================================================
# 4. PHASE 3: THE MAIN INTERFACE
# ==============================================================================
$main = New-Object System.Windows.Forms.Form
$main.Text = "Ultimate System Utility v27.0 (Bulletproof)"; $main.Size = "1000,850"; $main.StartPosition = "CenterScreen"
$main.BackColor = $Global:BgColor; $main.ForeColor = $Global:FgColor

$tabs = New-Object System.Windows.Forms.TabControl; $tabs.Dock = "Fill"; $main.Controls.Add($tabs)

# --- HELPER ---
function New-Btn ($t, $w, $act) {
    $b = New-Object System.Windows.Forms.Button; $b.Text = $t; $b.Size = "$w,45"; $b.FlatStyle = "Flat"
    $b.BackColor = $Global:AccColor; $b.ForeColor = "Black"; $b.Font = "Segoe UI, 9, style=Bold"; $b.Margin = "5,5,5,5"
    $b.Add_Click($act); return $b
}

# --- TABS ---
$tpProc = New-Object System.Windows.Forms.TabPage("PROCESSES")
$tpRepo = New-Object System.Windows.Forms.TabPage("REPO FILES")
$tpNet  = New-Object System.Windows.Forms.TabPage("NETWORK OPS")
$tpSys  = New-Object System.Windows.Forms.TabPage("SYSTEM CLEANER")
$tpGod  = New-Object System.Windows.Forms.TabPage("GOD MODE")
$tpDash = New-Object System.Windows.Forms.TabPage("DASHBOARD")

$tabs.Controls.AddRange(@($tpProc, $tpRepo, $tpNet, $tpSys, $tpGod, $tpDash))
foreach($t in $tabs.TabPages) { $t.BackColor = "#1e1e1e"; $t.ForeColor = "White" } # Force Dark Tabs for contrast

# 1. PROCESS MANAGER
$pTop = New-Object System.Windows.Forms.Panel; $pTop.Dock = "Top"; $pTop.Height = 60; $tpProc.Controls.Add($pTop)
$txtProc = New-Object System.Windows.Forms.TextBox; $txtProc.Dock = "Fill"; $txtProc.Multiline=$true; $txtProc.ScrollBars="Vertical"; $txtProc.BackColor="Black"; $txtProc.ForeColor="Lime"; $txtProc.Font="Consolas,9"; $tpProc.Controls.Add($txtProc)

$btnRef = New-Btn "REFRESH LIST" 150 { 
    $txtProc.Text = "PID`tNAME`t`tPRIORITY`r`n" + ("-"*60) + "`r`n"
    Get-Process | Select-Object -First 100 | Sort-Object ProcessName | ForEach { $txtProc.AppendText("$($_.Id)`t$($_.ProcessName)`t$($_.PriorityClass)`r`n") }
}; $btnRef.Location = "10,10"; $pTop.Controls.Add($btnRef)

$txtKill = New-Object System.Windows.Forms.TextBox; $txtKill.Location = "180,20"; $txtKill.Size = "150,30"; $pTop.Controls.Add($txtKill)
$btnKill = New-Btn "KILL ID/NAME" 150 { try { Stop-Process -Name $txtKill.Text -Force; $btnRef.PerformClick() } catch { [System.Windows.Forms.MessageBox]::Show("Process not found!") } }; $btnKill.Location = "340,10"; $pTop.Controls.Add($btnKill)

# 2. REPO MANAGER
$lstRepo = New-Object System.Windows.Forms.ListBox; $lstRepo.Location="20,50"; $lstRepo.Size="900,600"; $lstRepo.BackColor="Black"; $lstRepo.ForeColor="White"; $tpRepo.Controls.Add($lstRepo)
$btnScan = New-Btn "SCAN REPO" 200 { $lstRepo.Items.Clear(); if(Test-Path $extractPath){ Get-ChildItem $extractPath -Recurse | ForEach { $lstRepo.Items.Add($_.FullName) } } }; $btnScan.Location="20,670"; $tpRepo.Controls.Add($btnScan)
$btnExp = New-Btn "OPEN FOLDER" 200 { Invoke-Item $Global:RepoDir }; $btnExp.Location="240,670"; $tpRepo.Controls.Add($btnExp)

# 3. NETWORK OPS
$flowNet = New-Object System.Windows.Forms.FlowLayoutPanel; $flowNet.Dock="Fill"; $flowNet.AutoScroll=$true; $tpNet.Controls.Add($flowNet)
$flowNet.Controls.Add((New-Btn "GET PUBLIC IP INFO" 400 { try { $i=Invoke-RestMethod "http://ipinfo.io/json"; [System.Windows.Forms.MessageBox]::Show("IP: $($i.ip)`nCity: $($i.city)`nISP: $($i.org)") } catch { [System.Windows.Forms.MessageBox]::Show("Offline") } }))
$flowNet.Controls.Add((New-Btn "FLUSH DNS CACHE" 400 { Start-Process cmd "/k ipconfig /flushdns" }))
$flowNet.Controls.Add((New-Btn "PING GOOGLE" 400 { Start-Process cmd "/k ping 8.8.8.8" }))
$flowNet.Controls.Add((New-Btn "SHOW WIFI PASSWORDS" 400 { Start-Process cmd "/k netsh wlan show profiles" }))

# 4. SYSTEM CLEANER
$flowSys = New-Object System.Windows.Forms.FlowLayoutPanel; $flowSys.Dock="Fill"; $flowSys.AutoScroll=$true; $tpSys.Controls.Add($flowSys)
$flowSys.Controls.Add((New-Btn "EMPTY RECYCLE BIN" 400 { Clear-RecycleBin -Force -ErrorAction SilentlyContinue }))
$flowSys.Controls.Add((New-Btn "PURGE TEMP FILES" 400 { Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue }))
$flowSys.Controls.Add((New-Btn "SECURE FILE SHREDDER" 400 { 
    $d = New-Object System.Windows.Forms.OpenFileDialog; 
    if($d.ShowDialog() -eq "OK"){ 
        $f=$d.FileName; 
        [System.IO.File]::WriteAllText($f, "000000000000"); Remove-Item $f -Force; 
        [System.Windows.Forms.MessageBox]::Show("File Shredded.") 
    } 
}))

# 5. GOD MODE
$flowGod = New-Object System.Windows.Forms.FlowLayoutPanel; $flowGod.Dock="Fill"; $flowGod.AutoScroll=$true; $tpGod.Controls.Add($flowGod)
$flowGod.Controls.Add((New-Btn "SYSTEM FILE CHECK (SFC)" 400 { Start-Process cmd "/k sfc /scannow" -Verb RunAs }))
$flowGod.Controls.Add((New-Btn "DISM IMAGE REPAIR" 400 { Start-Process cmd "/k DISM /Online /Cleanup-Image /RestoreHealth" -Verb RunAs }))
$flowGod.Controls.Add((New-Btn "CREATE RESTORE POINT" 400 { Checkpoint-Computer -Description "USU_v27" -RestorePointType "MODIFY_SETTINGS" }))

# 6. DASHBOARD
$lblInfo = New-Object System.Windows.Forms.Label; $lblInfo.Location="20,20"; $lblInfo.Size="900,300"; $lblInfo.Font="Segoe UI, 12"; $lblInfo.ForeColor="White"; $tpDash.Controls.Add($lblInfo)
$tmr = New-Object System.Windows.Forms.Timer; $tmr.Interval=1000; $tmr.Add_Tick({
    try {
        $cpu = (Get-CimInstance Win32_Processor).LoadPercentage
        $free = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
        $used = [math]::Round($Global:Ram - ($free/1024), 1)
        $boot = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
        $uptime = (Get-Date) - $boot
        
        $lblInfo.Text = "SYSTEM DASHBOARD`n" + ("="*20) + "`n" +
                        "CPU LOAD:  $cpu %`n" +
                        "CPU NAME:  $Global:Cpu`n" +
                        "GPU NAME:  $Global:Gpu`n" +
                        "RAM USAGE: $used GB / $Global:Ram GB`n" +
                        "PUBLIC IP: $Global:IP`n" +
                        "UPTIME:    $($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m"
    } catch {}
}); $tmr.Start()

$btnRef.PerformClick()
$main.ShowDialog()