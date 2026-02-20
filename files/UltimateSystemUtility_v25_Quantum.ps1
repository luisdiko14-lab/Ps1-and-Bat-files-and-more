<#
    ULTIMATE SYSTEM UTILITY v25.0 - QUANTUM EDITION
    -------------------------------------------------
    - PHASE 1: GitHub Repo Downloader (luisdiko14-lab/Repo-1)
    - PHASE 2: Quantum Kernel Loader (Hardware Sync)
    - PHASE 3: The Infinity Dashboard (6 Tabs, 40+ Tools)
    - Zero-Error Architecture (Try/Catch Wrappers)
    - Auto-Admin Elevation
#>

# ==============================================================================
# 1. KERNEL PRE-FLIGHT (ADMIN CHECK)
# ==============================================================================
$ErrorActionPreference = "SilentlyContinue"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    try {
        Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        Exit
    } catch {
        [System.Windows.Forms.MessageBox]::Show("CRITICAL: Administrator Privileges Required.")
        Break
    }
}

Add-Type -AssemblyName System.Windows.Forms, System.Drawing, System.IO.Compression.FileSystem

# Global Config Paths
$Global:BaseDir = "C:\Users\$env:USERNAME\Downloads\USU_Config"
$Global:RepoDir = "C:\Users\$env:USERNAME\Downloads\USU_Repo_Download"
$Global:CpuName = "Detecting..."
$Global:GpuName = "Detecting..."
$Global:RamTotal = 0

# Ensure Paths
if (-not (Test-Path $Global:BaseDir)) { New-Item -Path $Global:BaseDir -ItemType Directory -Force | Out-Null }
if (-not (Test-Path $Global:RepoDir)) { New-Item -Path $Global:RepoDir -ItemType Directory -Force | Out-Null }

# ==============================================================================
# 2. PHASE 1: THE GITHUB DOWNLOADER (YOUR CODE INTEGRATED)
# ==============================================================================
$dlForm = New-Object System.Windows.Forms.Form
$dlForm.Size = "650,350"; $dlForm.StartPosition = "CenterScreen"; $dlForm.FormBorderStyle = "None"; $dlForm.BackColor = "#101010"

$lblD = New-Object System.Windows.Forms.Label; $lblD.Text = "DOWNLOADING REPOSITORY DATA..."; $lblD.ForeColor = "Cyan"; $lblD.Font = "Segoe UI, 14, style=Bold"; $lblD.Location = "20,20"; $lblD.AutoSize = $true
$txtLog = New-Object System.Windows.Forms.TextBox; $txtLog.Location = "20,60"; $txtLog.Size = "610,250"; $txtLog.Multiline = $true; $txtLog.BackColor = "Black"; $txtLog.ForeColor = "Lime"; $txtLog.Font = "Consolas, 9"; $txtLog.ReadOnly = $true

$dlForm.Controls.AddRange(@($lblD, $txtLog))
$dlForm.Show()
$dlForm.Refresh()

# --- THE DOWNLOAD LOGIC ---
$owner = "luisdiko14-lab"
$repo  = "Repo-1"
$tag   = "Test"
$url   = "https://github.com/$owner/$repo/archive/refs/tags/$tag.zip"
$zipFile = "$Global:RepoDir\$repo-$tag.zip"
$extractFolder = "$Global:RepoDir\$repo-$tag"

$txtLog.AppendText("Target: $owner/$repo ($tag)`r`n")
$txtLog.AppendText("URL: $url`r`n")
$dlForm.Refresh()

try {
    $txtLog.AppendText("Downloading ZIP... ")
    $dlForm.Refresh()
    Invoke-WebRequest -Uri $url -OutFile $zipFile
    $txtLog.AppendText("DONE.`r`nSaved to: $zipFile`r`n")
    $dlForm.Refresh(); Start-Sleep -Milliseconds 500

    if (-not (Test-Path -Path $extractFolder)) { New-Item -ItemType Directory -Path $extractFolder | Out-Null }

    $txtLog.AppendText("Extracting Archive... ")
    $dlForm.Refresh()
    Expand-Archive -Path $zipFile -DestinationPath $extractFolder -Force
    $txtLog.AppendText("DONE.`r`nExtracted to: $extractFolder`r`n")
    $dlForm.Refresh(); Start-Sleep -Milliseconds 1000

} catch {
    $txtLog.AppendText("ERROR: Download Failed. Internet may be down or Repo invalid.`r`n")
    $dlForm.Refresh(); Start-Sleep -Milliseconds 2000
}

$dlForm.Close()

# ==============================================================================
# 3. PHASE 2: THE QUANTUM LOADER (Cyber Style)
# ==============================================================================
$splash = New-Object System.Windows.Forms.Form
$splash.Size = "600,420"; $splash.StartPosition = "CenterScreen"; $splash.FormBorderStyle = "None"; $splash.BackColor = "Black"

$avatarBox = New-Object System.Windows.Forms.PictureBox
try {
    $wc = New-Object System.Net.WebClient
    $imgData = $wc.DownloadData("https://avatars.githubusercontent.com/u/218044862?v=4")
    $ms = New-Object System.IO.MemoryStream($imgData)
    $avatarBox.Image = [System.Drawing.Image]::FromStream($ms)
} catch { }
$avatarBox.SizeMode = "Zoom"; $avatarBox.Size = "120,120"; $avatarBox.Location = "240,30"
$splash.Controls.Add($avatarBox)

$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "QUANTUM KERNEL v25.0"; $lblTitle.ForeColor = "LimeGreen"; $lblTitle.Font = "Segoe UI, 18, style=Bold"; $lblTitle.Location = "165,170"; $lblTitle.AutoSize = $true

$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = "Initializing..."; $lblStatus.ForeColor = "White"; $lblStatus.Font = "Consolas, 10"; $lblStatus.Location = "30,240"; $lblStatus.Size = "540,50"; $lblStatus.TextAlign = "MiddleCenter"

$lblBar = New-Object System.Windows.Forms.Label
$lblBar.Text = ""; $lblBar.ForeColor = "LimeGreen"; $lblBar.Font = "Segoe UI, 22"; $lblBar.Location = "30,300"; $lblBar.Size = "540,60"; $lblBar.TextAlign = "MiddleCenter"

$splash.Controls.AddRange(@($lblTitle, $lblStatus, $lblBar))
$splash.Show(); $splash.Refresh()

# The "Smart" Loop: Updates UI while fetching hardware stats
$tasks = @("Generating sys.config", "Generating sys.ini", "Process Engine", "Net Adapter Scan", "CPU Identity", "GPU Identity", "RAM Mapping", "Battery Health", "Admin Suite", "Launching GUI")

for ($i=0; $i -lt 10; $i++) {
    $lblStatus.Text = $tasks[$i]
    $lblBar.Text += "✅"
    
    switch ($i) {
        0 { "RUNAS=ADMIN" | Out-File "$Global:BaseDir\sys.config" -Force }
        1 { "THEME=DARK" | Out-File "$Global:BaseDir\sys.ini" -Force }
        2 { Start-Sleep -Milliseconds 100 }
        3 { Start-Sleep -Milliseconds 100 }
        4 { $Global:CpuName = (Get-CimInstance Win32_Processor).Name.Trim() }
        5 { $Global:GpuName = (Get-CimInstance Win32_VideoController).Name.Trim() }
        6 { $Global:RamTotal = [math]::Round((Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1048576, 1) }
        7 { try { $Global:Batt = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue } catch {} }
        8 { Start-Sleep -Milliseconds 100 }
        9 { Start-Sleep -Milliseconds 500 }
    }
    $splash.Refresh(); Start-Sleep -Milliseconds 800
}
$splash.Close()

# ==============================================================================
# 4. PHASE 3: THE MAIN INFINITY INTERFACE
# ==============================================================================
$main = New-Object System.Windows.Forms.Form
$main.Text = "Ultimate System Utility v25.0 (Quantum Edition)"; $main.Size = "950,850"; $main.StartPosition = "CenterScreen"
$main.BackColor = "#202020"; $main.ForeColor = "White"

# --- HELPER: BUTTON GENERATOR ---
function New-Btn ($txt, $w, $h, $col, $act) {
    $b = New-Object System.Windows.Forms.Button
    $b.Text = $txt; $b.Size = "$w,$h"; $b.FlatStyle = "Flat"
    $b.BackColor = $col; $b.ForeColor = "Black"; $b.Font = "Segoe UI, 9, style=Bold"; $b.Margin = "8,8,8,8"
    $b.Add_Click($act)
    return $b
}

# --- TABS SETUP ---
$tabs = New-Object System.Windows.Forms.TabControl; $tabs.Dock = "Fill"; $main.Controls.Add($tabs)

$tp1 = New-Object System.Windows.Forms.TabPage("PROCESS MANAGER")
$tp2 = New-Object System.Windows.Forms.TabPage("REPO FILES")
$tp3 = New-Object System.Windows.Forms.TabPage("NETWORK OPS")
$tp4 = New-Object System.Windows.Forms.TabPage("SYSTEM CLEANER")
$tp5 = New-Object System.Windows.Forms.TabPage("GOD MODE")
$tp6 = New-Object System.Windows.Forms.TabPage("DASHBOARD")

$tabs.Controls.AddRange(@($tp1,$tp2,$tp3,$tp4,$tp5,$tp6))
foreach($t in $tabs.TabPages) { $t.BackColor = "#1e1e1e" }

# ----------------------------
# TAB 1: PROCESS MANAGER
# ----------------------------
$pHead = New-Object System.Windows.Forms.Panel; $pHead.Dock = "Top"; $pHead.Height = 60; $tp1.Controls.Add($pHead)
$txtProc = New-Object System.Windows.Forms.TextBox; $txtProc.Dock = "Fill"; $txtProc.Multiline=$true; $txtProc.ScrollBars="Vertical"; $txtProc.Font="Consolas,9"; $txtProc.BackColor="Black"; $txtProc.ForeColor="Lime"; $tp1.Controls.Add($txtProc)

$btnRef = New-Btn "REFRESH LIST" 120 40 "Cyan" {
    $txtProc.Clear(); $txtProc.AppendText("PID`t`tNAME`t`t`tPRIORITY`r`n" + ("="*70) + "`r`n")
    Get-Process | Sort-Object ProcessName | Select-Object -First 100 | ForEach-Object { $txtProc.AppendText("$($_.Id)`t`t$($_.ProcessName)`t`t$($_.PriorityClass)`r`n") }
}
$btnRef.Location = "10,10"; $pHead.Controls.Add($btnRef)

$txtKill = New-Object System.Windows.Forms.TextBox; $txtKill.Location = "150,18"; $txtKill.Size = "150,25"; $pHead.Controls.Add($txtKill)

$btnKill = New-Btn "KILL (Name)" 120 40 "Red" {
    if($txtKill.Text){ try{ Stop-Process -Name $txtKill.Text -Force; $btnRef.PerformClick(); [System.Windows.Forms.MessageBox]::Show("Killed.") }catch{} }
}
$btnKill.Location = "310,10"; $pHead.Controls.Add($btnKill)

# ----------------------------
# TAB 2: REPO FILES
# ----------------------------
$lblR = New-Object System.Windows.Forms.Label; $lblR.Text = "Downloaded Files ($owner/$repo):"; $lblR.Location="20,20"; $lblR.AutoSize=$true; $lblR.ForeColor="Cyan"; $tp2.Controls.Add($lblR)
$lstRepo = New-Object System.Windows.Forms.ListBox; $lstRepo.Location="20,50"; $lstRepo.Size="880,600"; $lstRepo.BackColor="Black"; $lstRepo.ForeColor="White"; $tp2.Controls.Add($lstRepo)

$btnScan = New-Btn "SCAN FOLDER" 200 50 "Lime" {
    $lstRepo.Items.Clear()
    if(Test-Path $Global:RepoDir){ Get-ChildItem $Global:RepoDir -Recurse | ForEach { $lstRepo.Items.Add($_.FullName) } }
}
$btnScan.Location="20,660"; $tp2.Controls.Add($btnScan)

$btnOpen = New-Btn "OPEN EXPLORER" 200 50 "Yellow" { Invoke-Item $Global:RepoDir }; $btnOpen.Location="240,660"; $tp2.Controls.Add($btnOpen)
$btnWipe = New-Btn "DELETE ALL" 200 50 "Red" { Remove-Item "$Global:RepoDir\*" -Recurse -Force; $lstRepo.Items.Clear() }; $btnWipe.Location="460,660"; $tp2.Controls.Add($btnWipe)

# ----------------------------
# TAB 3: NETWORK OPS
# ----------------------------
$flowNet = New-Object System.Windows.Forms.FlowLayoutPanel; $flowNet.Dock="Fill"; $flowNet.AutoScroll=$true; $tp3.Controls.Add($flowNet)
$netCmds = @(
    @("Ping Google", "ping google.com"),
    @("IP Config (Full)", "ipconfig /all"),
    @("Flush DNS", "ipconfig /flushdns"),
    @("Reset TCP/IP", "netsh int ip reset"),
    @("Release IP", "ipconfig /release"),
    @("Renew IP", "ipconfig /renew"),
    @("Show WiFi Passwords", "netsh wlan show profiles"),
    @("Trace Route", "tracert 8.8.8.8"),
    @("Active Connections", "netstat -an"),
    @("ARP Table", "arp -a")
)
foreach($n in $netCmds) { $flowNet.Controls.Add((New-Btn $n[0] 400 50 "LightBlue" { Start-Process cmd "/k $($n[1])" })) }

# ----------------------------
# TAB 4: SYSTEM CLEANER
# ----------------------------
$flowSys = New-Object System.Windows.Forms.FlowLayoutPanel; $flowSys.Dock="Fill"; $flowSys.AutoScroll=$true; $tp4.Controls.Add($flowSys)
$sysCmds = @(
    @("Empty Recycle Bin", "BIN"),
    @("Clean Temp Files", "TEMP"),
    @("Flush RAM Cache", "RAM"),
    @("Disk Cleanup", "cleanmgr"),
    @("Clear Event Logs", "LOGS"),
    @("Reset Windows Update", "WU"),
    @("Browser Cache (IE/Edge)", "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 8"),
    @("Remove Old Drivers", "cleanmgr /sageset:65535 & cleanmgr /sagerun:65535")
)
foreach($s in $sysCmds) { 
    $b = New-Btn $s[0] 400 50 "Orange" {
        if($s[1] -eq "BIN"){ try{ Clear-RecycleBin -Force -ErrorAction SilentlyContinue; [System.Windows.Forms.MessageBox]::Show("Bin Empty.") }catch{} }
        elseif($s[1] -eq "TEMP"){ Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue }
        elseif($s[1] -eq "RAM"){ [System.GC]::Collect(); [System.Windows.Forms.MessageBox]::Show("RAM Flushed.") }
        elseif($s[1] -eq "LOGS"){ wevtutil el | Foreach-Object {wevtutil cl $_} }
        elseif($s[1] -eq "WU"){ Start-Process cmd "/k net stop wuauserv & rd /s /q C:\Windows\SoftwareDistribution & net start wuauserv" }
        else { Start-Process cmd "/k $($s[1])" }
    }
    $flowSys.Controls.Add($b)
}

# ----------------------------
# TAB 5: GOD MODE
# ----------------------------
$flowGod = New-Object System.Windows.Forms.FlowLayoutPanel; $flowGod.Dock="Fill"; $flowGod.AutoScroll=$true; $tp5.Controls.Add($flowGod)
$godCmds = @(
    @("DISM Restore Health", "DISM /Online /Cleanup-Image /RestoreHealth"),
    @("SFC Scan Now", "sfc /scannow"),
    @("Create Restore Point", "Checkpoint-Computer -Description 'USU_Backup' -RestorePointType 'MODIFY_SETTINGS'"),
    @("Registry Editor", "regedit"),
    @("Services Manager", "services.msc"),
    @("DirectX Diagnostics", "dxdiag"),
    @("System Info", "systeminfo"),
    @("Check Disk C:", "chkdsk C:"),
    @("Show Hidden Files", "reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced /v Hidden /t REG_DWORD /d 1 /f"),
    @("Hide Hidden Files", "reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced /v Hidden /t REG_DWORD /d 0 /f"),
    @("Disable Telemetry", "reg add HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection /v AllowTelemetry /t REG_DWORD /d 0 /f"),
    @("Export Drivers", "pnputil /export-driver * C:\DriversBackup")
)
foreach($g in $godCmds) {
    $b = New-Btn $g[0] 400 50 "Violet" { 
        if($g[1] -like "Checkpoint*") { try { Enable-ComputerRestore -Drive "C:\"; Checkpoint-Computer -Description "USU" -RestorePointType "MODIFY_SETTINGS"; [System.Windows.Forms.MessageBox]::Show("Point Created.") } catch { [System.Windows.Forms.MessageBox]::Show("Enable System Restore first.") } }
        else { Start-Process cmd "/k $($g[1])" -Verb RunAs }
    }
    $flowGod.Controls.Add($b)
}

# ----------------------------
# TAB 6: DASHBOARD
# ----------------------------
$lblC = New-Object System.Windows.Forms.Label; $lblC.Location="20,40"; $lblC.Size="800,30"; $lblC.Font="Segoe UI,12"; $lblC.ForeColor="White"; $tp6.Controls.Add($lblC)
$pbC = New-Object System.Windows.Forms.ProgressBar; $pbC.Location="20,70"; $pbC.Size="800,30"; $tp6.Controls.Add($pbC)

$lblM = New-Object System.Windows.Forms.Label; $lblM.Location="20,120"; $lblM.Size="800,30"; $lblM.Font="Segoe UI,12"; $lblM.ForeColor="White"; $tp6.Controls.Add($lblM)
$pbM = New-Object System.Windows.Forms.ProgressBar; $pbM.Location="20,150"; $pbM.Size="800,30"; $tp6.Controls.Add($pbM)

$lblG = New-Object System.Windows.Forms.Label; $lblG.Text="GPU: $Global:GpuName"; $lblG.Location="20,200"; $lblG.AutoSize=$true; $lblG.Font="Segoe UI,14,style=Bold"; $lblG.ForeColor="Cyan"; $tp6.Controls.Add($lblG)

$tmr = New-Object System.Windows.Forms.Timer; $tmr.Interval=2000; $tmr.Add_Tick({
    $l = (Get-CimInstance Win32_Processor).LoadPercentage
    $lblC.Text = "CPU: $Global:CpuName ($l%)"; $pbC.Value = [int]$l
    $free = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
    $used = [math]::Round($Global:RamTotal - ($free/1024/1024), 1)
    $lblM.Text = "RAM: $used GB / $Global:RamTotal GB"; $pbM.Value = [int](($used/$Global:RamTotal)*100)
}); $tmr.Start()

$btnS = New-Btn "SHUTDOWN (10m)" 200 60 "Red" { Start-Process shutdown "/s /t 600" }; $btnS.Location="20,300"; $tp6.Controls.Add($btnS)
$btnA = New-Btn "ABORT" 200 60 "Green" { Start-Process shutdown "/a" }; $btnA.Location="240,300"; $tp6.Controls.Add($btnA)

# --- EXECUTE ---
$btnRef.PerformClick()
$btnScan.PerformClick()
$main.ShowDialog()
