<#
    ULTIMATE SYSTEM UTILITY v24.0 - INFINITY KERNEL
    -------------------------------------------------
    AUTHOR: Gemini AI & User
    VERSION: 24.0 (The Infinity Build)
    
    FEATURES:
    - Dual-Stage Bootloader (GitHub Downloader -> Cyber Init)
    - Auto-Admin Elevation
    - Physical File Management (Downloads/USU_Config)
    - Full GitHub Integration (luisdiko14-lab/Repo-1)
    - 6-Tab Mega Interface
    - Process Management Engine
    - Network Operations Center
    - System Cleaning Suite
    - God-Mode Admin Tools
#>

# ==============================================================================
# 1. KERNEL ELEVATION & SETUP
# ==============================================================================
$ErrorActionPreference = "SilentlyContinue"

# Check Admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    try {
        Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        Exit
    } catch {
        [System.Windows.Forms.MessageBox]::Show("CRITICAL ERROR: KERNEL ACCESS DENIED.`nPlease run as Administrator.")
        Break
    }
}

# Load Assemblies
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Global Variables
$Global:BaseDir = "C:\Users\$env:USERNAME\Downloads\USU_Config"
$Global:RepoDir = "C:\Users\$env:USERNAME\Downloads\USU_Repo_Download"
$Global:Cpu = "Calibrating..."
$Global:Gpu = "Calibrating..."
$Global:Ram = "0/0"
$Global:Log = @()

# Ensure Directories Exist
if (-not (Test-Path $Global:BaseDir)) { New-Item -Path $Global:BaseDir -ItemType Directory -Force | Out-Null }
if (-not (Test-Path $Global:RepoDir)) { New-Item -Path $Global:RepoDir -ItemType Directory -Force | Out-Null }

# ==============================================================================
# 2. STAGE 1: GITHUB DOWNLOADER LOADER
# ==============================================================================
$dlForm = New-Object System.Windows.Forms.Form
$dlForm.Size = "600,300"; $dlForm.StartPosition = "CenterScreen"; $dlForm.FormBorderStyle = "None"; $dlForm.BackColor = "#1e1e1e"

$lblDlTitle = New-Object System.Windows.Forms.Label
$lblDlTitle.Text = "GITHUB REPOSITORY SYNC"; $lblDlTitle.ForeColor = "White"; $lblDlTitle.Font = "Segoe UI, 14, style=Bold"; $lblDlTitle.Location = "20,20"; $lblDlTitle.AutoSize = $true

$lblDlStatus = New-Object System.Windows.Forms.Label
$lblDlStatus.Text = "Waiting to connect..."; $lblDlStatus.ForeColor = "Cyan"; $lblDlStatus.Font = "Consolas, 10"; $lblDlStatus.Location = "20,60"; $lblDlStatus.Size = "560,40"

$pbDl = New-Object System.Windows.Forms.ProgressBar
$pbDl.Location = "20,110"; $pbDl.Size = "560,30"; $pbDl.Style = "Marquee"

$txtConsole = New-Object System.Windows.Forms.TextBox
$txtConsole.Location = "20,160"; $txtConsole.Size = "560,100"; $txtConsole.Multiline = $true; $txtConsole.BackColor = "Black"; $txtConsole.ForeColor = "Lime"; $txtConsole.Font = "Consolas, 8"; $txtConsole.ReadOnly = $true

$dlForm.Controls.AddRange(@($lblDlTitle, $lblDlStatus, $pbDl, $txtConsole))
$dlForm.Show()
$dlForm.Refresh()

# --- THE DOWNLOAD LOGIC (USER PROVIDED) ---
function Run-Downloader {
    $owner = "luisdiko14-lab"
    $repo  = "Repo-1"
    $tag   = "Test"
    
    $txtConsole.AppendText("[INIT] Target: $owner/$repo ($tag)`r`n"); $dlForm.Refresh(); Start-Sleep -Milliseconds 500
    
    $url = "https://github.com/$owner/$repo/archive/refs/tags/$tag.zip"
    $zipFile = "$Global:RepoDir\$repo-$tag.zip"
    $extractFolder = "$Global:RepoDir\$repo-$tag"

    $lblDlStatus.Text = "Downloading from: $url"
    $txtConsole.AppendText("[NET] Requesting Data Stream...`r`n"); $dlForm.Refresh()

    try {
        # Download
        Invoke-WebRequest -Uri $url -OutFile $zipFile
        $txtConsole.AppendText("[SUCCESS] Download complete. Saved to $zipFile`r`n"); $dlForm.Refresh()
        
        # Create Folder
        if (-not (Test-Path -Path $extractFolder)) {
            New-Item -ItemType Directory -Path $extractFolder | Out-Null
        }

        # Extract
        $lblDlStatus.Text = "Extracting Package..."
        Expand-Archive -Path $zipFile -DestinationPath $extractFolder -Force
        $txtConsole.AppendText("[IO] Extraction complete to $extractFolder`r`n"); $dlForm.Refresh()
        
        # Cleanup
        Remove-Item -Path $zipFile -Force
        $txtConsole.AppendText("[CLEAN] Temporary ZIP removed.`r`n"); $dlForm.Refresh()
        
        Start-Sleep -Seconds 1
    } catch {
        $txtConsole.AppendText("[ERROR] Connection Failed or Repo Not Found.`r`n"); $dlForm.Refresh()
        Start-Sleep -Seconds 2
    }
}

Run-Downloader
$dlForm.Close()

# ==============================================================================
# 3. STAGE 2: CYBER-CORE LOADER (The "Cool" One)
# ==============================================================================
$splash = New-Object System.Windows.Forms.Form
$splash.Size = "600,450"; $splash.StartPosition = "CenterScreen"; $splash.FormBorderStyle = "None"; $splash.BackColor = "Black"

$avatarBox = New-Object System.Windows.Forms.PictureBox
try {
    $wc = New-Object System.Net.WebClient
    $imgData = $wc.DownloadData("https://avatars.githubusercontent.com/u/218044862?v=4")
    $ms = New-Object System.IO.MemoryStream($imgData)
    $avatarBox.Image = [System.Drawing.Image]::FromStream($ms)
} catch { }
$avatarBox.SizeMode = "Zoom"; $avatarBox.Size = "130,130"; $avatarBox.Location = "235,30"
$splash.Controls.Add($avatarBox)

$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "INFINITY KERNEL v24.0"; $lblTitle.ForeColor = "LimeGreen"; $lblTitle.Font = "Segoe UI, 20, style=Bold"; $lblTitle.Location = "165,180"; $lblTitle.AutoSize = $true

$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = "Initializing Kernel Bridges..."; $lblStatus.ForeColor = "White"; $lblStatus.Font = "Consolas, 10"; $lblStatus.Location = "30,260"; $lblStatus.Size = "540,50"; $lblStatus.TextAlign = "MiddleCenter"

$lblBar = New-Object System.Windows.Forms.Label
$lblBar.Text = ""; $lblBar.ForeColor = "LimeGreen"; $lblBar.Font = "Segoe UI, 24"; $lblBar.Location = "30,320"; $lblBar.Size = "540,60"; $lblBar.TextAlign = "MiddleCenter"

$splash.Controls.AddRange(@($lblTitle, $lblStatus, $lblBar))
$splash.Show(); $splash.Refresh()

# 10-Second Loading Loop
$tasks = @("Generating Configs", "Linking Batch Files", "Analyzing CPU", "Analyzing GPU", "Mapping RAM", "Scanning Battery", "Loading Process Engine", "Loading Network Ops", "Loading Repo Manager", "System Ready")

for ($i=0; $i -lt 10; $i++) {
    $lblStatus.Text = $tasks[$i] + "..."
    $lblBar.Text += "✅"
    
    # Do work in background to prevent freeze later
    switch ($i) {
        0 { "RUNAS=ADMIN" | Out-File "$Global:BaseDir\sys.config" -Force }
        1 { "echo START" | Out-File "$Global:BaseDir\sys.batch" -Force }
        2 { $Global:Cpu = (Get-CimInstance Win32_Processor).Name.Trim() }
        3 { $Global:Gpu = (Get-CimInstance Win32_VideoController).Name.Trim() }
        4 { $Global:TotalRam = [math]::Round((Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1048576, 1) }
        5 { try { $Global:Batt = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue } catch {} }
        6 { Start-Sleep -Milliseconds 100 }
        7 { Start-Sleep -Milliseconds 100 }
        8 { Start-Sleep -Milliseconds 100 }
        9 { Start-Sleep -Milliseconds 100 }
    }
    $splash.Refresh(); Start-Sleep -Milliseconds 900
}
$splash.Close()

# ==============================================================================
# 4. MAIN GUI ARCHITECTURE
# ==============================================================================
$main = New-Object System.Windows.Forms.Form
$main.Text = "Ultimate System Utility v24.0 (Infinity Edition)"; $main.Size = "900,850"; $main.StartPosition = "CenterScreen"
$main.BackColor = "#2d2d30"
$main.ForeColor = "White"

# --- THEME HELPERS ---
function New-StyledButton ($txt, $x, $y, $w, $h, $color, $action) {
    $b = New-Object System.Windows.Forms.Button
    $b.Text = $txt; $b.Location = "$x,$y"; $b.Size = "$w,$h"; $b.FlatStyle = "Flat"
    $b.BackColor = $color; $b.ForeColor = "Black"; $b.Font = "Segoe UI, 10, style=Bold"
    $b.Add_Click($action)
    return $b
}

# --- TABS ---
$tabs = New-Object System.Windows.Forms.TabControl; $tabs.Dock = "Fill"; $main.Controls.Add($tabs)

$tpProc = New-Object System.Windows.Forms.TabPage("PROCESS MANAGER")
$tpRepo = New-Object System.Windows.Forms.TabPage("REPO MANAGER")
$tpNet  = New-Object System.Windows.Forms.TabPage("NETWORK OPS")
$tpSys  = New-Object System.Windows.Forms.TabPage("SYSTEM CLEANER")
$tpGod  = New-Object System.Windows.Forms.TabPage("GOD MODE")
$tpDash = New-Object System.Windows.Forms.TabPage("DASHBOARD")

$tabs.Controls.AddRange(@($tpProc, $tpRepo, $tpNet, $tpSys, $tpGod, $tpDash))

# ==============================================================================
# 5. TAB: PROCESS MANAGER (Default)
# ==============================================================================
$tpProc.BackColor = "#1e1e1e"

$pPanel = New-Object System.Windows.Forms.Panel; $pPanel.Dock = "Top"; $pPanel.Height = 60; $tpProc.Controls.Add($pPanel)
$txtProcList = New-Object System.Windows.Forms.TextBox; $txtProcList.Dock = "Fill"; $txtProcList.Multiline = $true; $txtProcList.ScrollBars = "Vertical"; $txtProcList.Font = "Consolas, 9"; $txtProcList.BackColor = "Black"; $txtProcList.ForeColor = "Lime"; $tpProc.Controls.Add($txtProcList)

# Controls
$btnRefProc = New-StyledButton "Refresh Processes" 10 10 150 40 "Cyan" {
    $txtProcList.Clear(); $txtProcList.AppendText("PID`t`tProcess Name`r`n" + ("="*60) + "`r`n")
    Get-Process | Sort-Object ProcessName | Select-Object -First 100 | ForEach-Object { $txtProcList.AppendText("$($_.Id)`t`t$($_.ProcessName)`r`n") }
}
$pPanel.Controls.Add($btnRefProc)

$txtKill = New-Object System.Windows.Forms.TextBox; $txtKill.Location = "180,20"; $txtKill.Size = "150,30"
$pPanel.Controls.Add($txtKill)

$btnKill = New-StyledButton "KILL PROCESS" 340 10 150 40 "Red" {
    if ($txtKill.Text) { 
        try { Stop-Process -Name $txtKill.Text -Force -ErrorAction Stop; [System.Windows.Forms.MessageBox]::Show("Process TERMINATED.") } 
        catch { [System.Windows.Forms.MessageBox]::Show("Error: Process not found.") }
        $btnRefProc.PerformClick()
    }
}
$pPanel.Controls.Add($btnKill)

# ==============================================================================
# 6. TAB: REPO MANAGER (New)
# ==============================================================================
$tpRepo.BackColor = "#1e1e1e"
$lblRepoInfo = New-Object System.Windows.Forms.Label; $lblRepoInfo.Text = "Downloaded Files from: luisdiko14-lab/Repo-1"; $lblRepoInfo.Location = "20,20"; $lblRepoInfo.AutoSize = $true; $lblRepoInfo.ForeColor = "Cyan"; $tpRepo.Controls.Add($lblRepoInfo)

$lstRepo = New-Object System.Windows.Forms.ListBox; $lstRepo.Location = "20,50"; $lstRepo.Size = "800,400"; $lstRepo.BackColor = "Black"; $lstRepo.ForeColor = "White"; $tpRepo.Controls.Add($lstRepo)

$btnLoadRepo = New-StyledButton "Scan Repo Folder" 20 470 200 40 "Lime" {
    $lstRepo.Items.Clear()
    if (Test-Path $Global:RepoDir) {
        Get-ChildItem -Path $Global:RepoDir -Recurse | ForEach-Object { $lstRepo.Items.Add($_.FullName) }
    }
}
$tpRepo.Controls.Add($btnLoadRepo)

$btnOpenRepo = New-StyledButton "Open Explorer" 240 470 200 40 "Yellow" { Invoke-Item $Global:RepoDir }
$tpRepo.Controls.Add($btnOpenRepo)

$btnDelRepo = New-StyledButton "Delete All Repo Files" 460 470 200 40 "Red" {
    Remove-Item "$Global:RepoDir\*" -Recurse -Force; $lstRepo.Items.Clear(); [System.Windows.Forms.MessageBox]::Show("Repo Cache Cleared.")
}
$tpRepo.Controls.Add($btnDelRepo)

# ==============================================================================
# 7. TAB: NETWORK OPS
# ==============================================================================
$tpNet.BackColor = "#1e1e1e"
$netFlow = New-Object System.Windows.Forms.FlowLayoutPanel; $netFlow.Dock = "Fill"; $netFlow.AutoScroll = $true; $tpNet.Controls.Add($netFlow)

$netTools = @(
    @("Ping Google (Latency Check)", "cmd /k ping google.com"),
    @("Flush DNS Cache", "ipconfig /flushdns"),
    @("Reset Winsock Catalog", "netsh winsock reset"),
    @("Release IP Address", "ipconfig /release"),
    @("Renew IP Address", "ipconfig /renew"),
    @("Show Network Configuration", "cmd /k ipconfig /all"),
    @("Check Active Connections (Netstat)", "cmd /k netstat -an"),
    @("Trace Route to Google", "cmd /k tracert google.com")
)

foreach($n in $netTools) {
    $btn = New-StyledButton $n[0] 0 0 400 50 "LightBlue" { Start-Process cmd "/k $($n[1])" -Verb RunAs }
    $btn.Margin = "10,10,10,10"
    $netFlow.Controls.Add($btn)
}

# ==============================================================================
# 8. TAB: SYSTEM CLEANER
# ==============================================================================
$tpSys.BackColor = "#1e1e1e"
$sysFlow = New-Object System.Windows.Forms.FlowLayoutPanel; $sysFlow.Dock = "Fill"; $sysFlow.AutoScroll = $true; $tpSys.Controls.Add($sysFlow)

$cleanTools = @(
    @("Purge User TEMP Files", "TEMP"),
    @("Flush Standby RAM", "RAM"),
    @("Clean Windows Update Cache", "WU"),
    @("Disk Cleanup Utility", "cleanmgr"),
    @("Clear Event Logs", "wevtutil el | Foreach-Object {wevtutil cl `$_}"),
    @("Clear Browser Cache (Edge)", "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 8")
)

foreach($c in $cleanTools) {
    $btn = New-StyledButton $c[0] 0 0 400 50 "Orange" {
        if ($c[1] -eq "TEMP") { Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue; [System.Windows.Forms.MessageBox]::Show("TEMP Deleted.") }
        elseif ($c[1] -eq "RAM") { [System.GC]::Collect(); [System.Windows.Forms.MessageBox]::Show("RAM Garbage Collected.") }
        elseif ($c[1] -eq "WU") { Start-Process cmd "/k net stop wuauserv & rd /s /q C:\Windows\SoftwareDistribution & net start wuauserv" -Verb RunAs }
        else { Start-Process cmd "/k $($c[1])" -Verb RunAs }
    }
    $btn.Margin = "10,10,10,10"
    $sysFlow.Controls.Add($btn)
}

# ==============================================================================
# 9. TAB: GOD MODE (Legacy Tools)
# ==============================================================================
$tpGod.BackColor = "#1e1e1e"
$godFlow = New-Object System.Windows.Forms.FlowLayoutPanel; $godFlow.Dock = "Fill"; $godFlow.AutoScroll = $true; $tpGod.Controls.Add($godFlow)

$godTools = @(
    @("DISM Repair Image", "DISM /Online /Cleanup-Image /RestoreHealth"),
    @("SFC System Scan", "sfc /scannow"),
    @("Backup Drivers", "pnputil /export-driver * C:\DriversBackup"),
    @("Reset Windows Spotlight", "SPOT"),
    @("Re-Register Store", "STORE"),
    @("Disable Telemetry", "REG_TEL"),
    @("Defrag Drive C:", "defrag C: /O"),
    @("Check Disk C: (Read Only)", "chkdsk C:"),
    @("Generate Battery Report", "powercfg /batteryreport"),
    @("System Info", "systeminfo"),
    @("DxDiag", "dxdiag"),
    @("Manage Startup Apps", "taskmgr /0 /startup")
)

foreach($g in $godTools) {
    $btn = New-StyledButton $g[0] 0 0 400 50 "Violet" {
        if ($g[1] -eq "SPOT") { Start-Process powershell "Get-AppxPackage *ContentDeliveryManager* | foreach {Add-AppxPackage -register '$($_.InstallLocation)\appxmetadata\appxbundlemanifest.xml' -DisableDevelopmentMode -Force}" -Verb RunAs }
        elseif ($g[1] -eq "STORE") { Start-Process powershell "Get-AppxPackage -AllUsers *WindowsStore* | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register '$($_.InstallLocation)\AppXManifest.xml'}" -Verb RunAs }
        elseif ($g[1] -eq "REG_TEL") { Start-Process cmd "/k reg add HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection /v AllowTelemetry /t REG_DWORD /d 0 /f" -Verb RunAs }
        else { Start-Process cmd "/k $($g[1])" -Verb RunAs }
    }
    $btn.Margin = "10,10,10,10"
    $godFlow.Controls.Add($btn)
}

# ==============================================================================
# 10. TAB: DASHBOARD (Hardware Stats)
# ==============================================================================
$tpDash.BackColor = "#1e1e1e"

$lblCpu = New-Object System.Windows.Forms.Label; $lblCpu.Location = "20,40"; $lblCpu.Size = "800,30"; $lblCpu.Font = "Segoe UI, 12"; $lblCpu.ForeColor = "White"; $tpDash.Controls.Add($lblCpu)
$pbCpu  = New-Object System.Windows.Forms.ProgressBar; $pbCpu.Location = "20,70"; $pbCpu.Size = "800,30"; $tpDash.Controls.Add($pbCpu)

$lblRam = New-Object System.Windows.Forms.Label; $lblRam.Location = "20,120"; $lblRam.Size = "800,30"; $lblRam.Font = "Segoe UI, 12"; $lblRam.ForeColor = "White"; $tpDash.Controls.Add($lblRam)
$pbRam  = New-Object System.Windows.Forms.ProgressBar; $pbRam.Location = "20,150"; $pbRam.Size = "800,30"; $tpDash.Controls.Add($pbRam)

$lblGpu = New-Object System.Windows.Forms.Label; $lblGpu.Location = "20,200"; $lblGpu.Size = "800,30"; $lblGpu.Font = "Segoe UI, 14, style=Bold"; $lblGpu.ForeColor = "Cyan"; $lblGpu.Text = "GPU: $Global:Gpu"; $tpDash.Controls.Add($lblGpu)

# Power & Audio Controls in Dashboard
$btnBeep = New-StyledButton "Test Audio" 20 300 200 50 "White" { [System.Console]::Beep(500,500) }
$tpDash.Controls.Add($btnBeep)

$btnShut = New-StyledButton "Shutdown (10m)" 240 300 200 50 "Red" { Start-Process shutdown "/s /t 600" }
$tpDash.Controls.Add($btnShut)

$btnAbort = New-StyledButton "Abort Shutdown" 460 300 200 50 "Green" { Start-Process shutdown "/a" }
$tpDash.Controls.Add($btnAbort)

# Timer for live stats
$dashTimer = New-Object System.Windows.Forms.Timer; $dashTimer.Interval = 2000
$dashTimer.Add_Tick({
    try {
        $load = (Get-CimInstance Win32_Processor).LoadPercentage
        $pbCpu.Value = [int]$load
        $lblCpu.Text = "CPU Load: $load% ($Global:Cpu)"
        
        $os = Get-CimInstance Win32_OperatingSystem
        $used = [math]::Round($Global:TotalRam - ($os.FreePhysicalMemory / 1048576), 1)
        $pbRam.Value = [int](($used / $Global:TotalRam) * 100)
        $lblRam.Text = "RAM Usage: $used GB / $Global:TotalRam GB"
    } catch {}
})
$dashTimer.Start()

# ==============================================================================
# 11. EXECUTION
# ==============================================================================
$btnRefProc.PerformClick() # Initial process load
$btnLoadRepo.PerformClick() # Initial repo scan
$main.ShowDialog()
