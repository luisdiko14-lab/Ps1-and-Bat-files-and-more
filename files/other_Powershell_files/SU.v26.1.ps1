<#
    ULTIMATE SYSTEM UTILITY v26.2 - STABLE LINK UPDATE
    -------------------------------------------------
    - UPDATED: Downloads specific tag 'a' from luisdiko14-lab/Repo-1
    - PRE-BOOT: Theme Selection & Download Confirmation
    - CORE: Math-Based Loader & Anti-Freeze Architecture
    - UI: 6-Tab Infinity Dashboard with Dark/Light Mode
#>

# ==============================================================================
# 1. KERNEL PRE-FLIGHT (ADMIN CHECK & SETUP)
# ==============================================================================
$ErrorActionPreference = "SilentlyContinue"

# Check Admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    try {
        Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        Exit
    } catch {
        [System.Windows.Forms.MessageBox]::Show("CRITICAL: Admin Privileges Required.")
        Break
    }
}

Add-Type -AssemblyName System.Windows.Forms, System.Drawing, System.IO.Compression.FileSystem

# --- STEP 1: THEME SELECTOR ---
$themeResult = [System.Windows.Forms.MessageBox]::Show(
    "Choose Theme:`n`nYES = Dark Mode`nNO = Light Mode`nCANCEL = Exit Program", 
    "System Utility v26.2 Setup", 
    [System.Windows.Forms.MessageBoxButtons]::YesNoCancel, 
    [System.Windows.Forms.MessageBoxIcon]::Question
)

if ($themeResult -eq "Cancel") { Exit }

# Define Colors
if ($themeResult -eq "Yes") {
    $Global:BgColor = "#202020"; $Global:FgColor = "White"; $Global:PanelColor = "#1e1e1e"; $Global:TxtColor = "Lime"; $Global:BoxColor = "Black"
} else {
    $Global:BgColor = "#F0F0F0"; $Global:FgColor = "Black"; $Global:PanelColor = "White"; $Global:TxtColor = "Black"; $Global:BoxColor = "White"
}

# --- STEP 2: DOWNLOAD CONFIRMATION ---
$dlResult = [System.Windows.Forms.MessageBox]::Show(
    "Do you want to download system utility v26.2 data from GitHub?", 
    "Download Confirmation", 
    [System.Windows.Forms.MessageBoxButtons]::YesNo, 
    [System.Windows.Forms.MessageBoxIcon]::Information
)

if ($dlResult -eq "No") { Exit }

# Global Paths
$Global:BaseDir = "C:\Users\$env:USERNAME\Downloads\USU_Config"
$Global:RepoDir = "C:\Users\$env:USERNAME\Downloads\USU_Repo_Download"
$Global:CpuName = "Detecting..."; $Global:GpuName = "Detecting..."; $Global:RamTotal = 0

# Create Directories
if (-not (Test-Path $Global:BaseDir)) { New-Item -Path $Global:BaseDir -ItemType Directory -Force | Out-Null }
if (-not (Test-Path $Global:RepoDir)) { New-Item -Path $Global:RepoDir -ItemType Directory -Force | Out-Null }

# ==============================================================================
# 2. PHASE 1: GITHUB DOWNLOADER (UPDATED LINK)
# ==============================================================================
$dlForm = New-Object System.Windows.Forms.Form
$dlForm.Size = "600,300"; $dlForm.StartPosition = "CenterScreen"; $dlForm.FormBorderStyle = "None"; $dlForm.BackColor = $Global:BgColor

$lblD = New-Object System.Windows.Forms.Label; $lblD.Text = "DOWNLOADING REPO DATA..."; $lblD.ForeColor = "Cyan"; $lblD.Font = "Segoe UI, 14, style=Bold"; $lblD.Location = "20,20"; $lblD.AutoSize = $true
$txtLog = New-Object System.Windows.Forms.TextBox; $txtLog.Location = "20,60"; $txtLog.Size = "560,200"; $txtLog.Multiline = $true; $txtLog.BackColor = $Global:BoxColor; $txtLog.ForeColor = $Global:TxtColor; $txtLog.Font = "Consolas, 9"; $txtLog.ReadOnly = $true

$dlForm.Controls.AddRange(@($lblD, $txtLog))
$dlForm.Show(); $dlForm.Refresh()

# --- NEW URL LOGIC ---
$owner = "luisdiko14-lab"
$repo  = "Repo-1"
$tag   = "a"   # <--- UPDATED TAG
$url   = "https://github.com/$owner/$repo/archive/refs/tags/$tag.zip" # <--- UPDATED URL

$zipFile = "$Global:RepoDir\$repo-$tag.zip"
$extractFolder = "$Global:RepoDir\$repo-$tag"

try {
    $txtLog.AppendText("Target: $url`r`n")
    $txtLog.AppendText("Connecting... ")
    $dlForm.Refresh()
    
    # Download
    Invoke-WebRequest -Uri $url -OutFile $zipFile -ErrorAction Stop
    $txtLog.AppendText("SUCCESS.`r`n")
    $dlForm.Refresh()
    
    # Extract
    $txtLog.AppendText("Extracting Package... ")
    $dlForm.Refresh()
    if (-not (Test-Path $extractFolder)) { New-Item -ItemType Directory -Path $extractFolder -Force | Out-Null }
    
    Expand-Archive -Path $zipFile -DestinationPath $extractFolder -Force -ErrorAction Stop
    $txtLog.AppendText("DONE.`r`nSaved to: $extractFolder`r`n")
    $dlForm.Refresh(); Start-Sleep -Milliseconds 800

} catch {
    $txtLog.AppendText("ERROR: Download failed or Link invalid. Continuing safely...`r`n")
    $dlForm.Refresh(); Start-Sleep -Seconds 2
}
$dlForm.Close()

# ==============================================================================
# 3. PHASE 2: MATH-BASED LOADER (REAL %)
# ==============================================================================
$splash = New-Object System.Windows.Forms.Form
$splash.Size = "600,400"; $splash.StartPosition = "CenterScreen"; $splash.FormBorderStyle = "None"; $splash.BackColor = "Black"

$avatarBox = New-Object System.Windows.Forms.PictureBox
try {
    $wc = New-Object System.Net.WebClient
    $imgData = $wc.DownloadData("https://avatars.githubusercontent.com/u/218044862?v=4")
    $ms = New-Object System.IO.MemoryStream($imgData)
    $avatarBox.Image = [System.Drawing.Image]::FromStream($ms)
} catch { }
$avatarBox.SizeMode = "Zoom"; $avatarBox.Size = "110,110"; $avatarBox.Location = "245,30"
$splash.Controls.Add($avatarBox)

$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "SYSTEM UTILITY v26.2"; $lblTitle.ForeColor = "LimeGreen"; $lblTitle.Font = "Segoe UI, 18, style=Bold"; $lblTitle.Location = "165,160"; $lblTitle.AutoSize = $true

$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = "Boot Sequence..."; $lblStatus.ForeColor = "White"; $lblStatus.Font = "Consolas, 10"; $lblStatus.Location = "30,220"; $lblStatus.Size = "540,30"; $lblStatus.TextAlign = "MiddleCenter"

$pbLoad = New-Object System.Windows.Forms.ProgressBar; $pbLoad.Location = "50,260"; $pbLoad.Size = "500,30"
$lblPerc = New-Object System.Windows.Forms.Label; $lblPerc.Text = "0%"; $lblPerc.ForeColor = "White"; $lblPerc.Font = "Segoe UI, 12"; $lblPerc.Location = "270,300"; $lblPerc.AutoSize = $true

$splash.Controls.AddRange(@($lblTitle, $lblStatus, $pbLoad, $lblPerc))
$splash.Show(); $splash.Refresh()

# Tasks
$tasks = @("Generating Configs", "Optimizing GUI", "Scanning CPU ID", "Scanning GPU ID", "Mapping RAM", "Checking Battery", "Loading Net Tools", "Loading Admin Suite", "Applying Theme", "Ready")
$totalTasks = $tasks.Count

for ($i=0; $i -lt $totalTasks; $i++) {
    $lblStatus.Text = $tasks[$i]
    
    # Calculate %
    $percentage = [math]::Round((($i + 1) / $totalTasks) * 100)
    $pbLoad.Value = $percentage
    $lblPerc.Text = "$percentage%"
    
    switch ($i) {
        0 { "RUNAS=ADMIN" | Out-File "$Global:BaseDir\sys.config" -Force }
        1 { Start-Sleep -Milliseconds 100 }
        2 { $Global:CpuName = (Get-CimInstance Win32_Processor).Name.Trim() }
        3 { $Global:GpuName = (Get-CimInstance Win32_VideoController).Name.Trim() }
        4 { $Global:RamTotal = [math]::Round((Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1048576, 1) }
        5 { try { $Global:Batt = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue } catch {} }
        6 { Start-Sleep -Milliseconds 100 }
        7 { Start-Sleep -Milliseconds 100 }
        8 { Start-Sleep -Milliseconds 200 }
    }
    $splash.Refresh(); Start-Sleep -Milliseconds 500
}
$splash.Close()

# ==============================================================================
# 4. PHASE 3: MAIN GUI (THEMED)
# ==============================================================================
$main = New-Object System.Windows.Forms.Form
$main.Text = "Ultimate System Utility v26.2"; $main.Size = "950,850"; $main.StartPosition = "CenterScreen"
$main.BackColor = $Global:BgColor; $main.ForeColor = $Global:FgColor

function New-Btn ($txt, $w, $h, $col, $act) {
    $b = New-Object System.Windows.Forms.Button
    $b.Text = $txt; $b.Size = "$w,$h"; $b.FlatStyle = "Flat"
    $b.BackColor = $col; $b.ForeColor = "Black"; $b.Font = "Segoe UI, 9, style=Bold"; $b.Margin = "8,8,8,8"
    $b.Add_Click($act)
    return $b
}

$tabs = New-Object System.Windows.Forms.TabControl; $tabs.Dock = "Fill"; $main.Controls.Add($tabs)

$tp1 = New-Object System.Windows.Forms.TabPage("PROCESS MANAGER")
$tp2 = New-Object System.Windows.Forms.TabPage("REPO FILES")
$tp3 = New-Object System.Windows.Forms.TabPage("NETWORK")
$tp4 = New-Object System.Windows.Forms.TabPage("CLEANER")
$tp5 = New-Object System.Windows.Forms.TabPage("GOD MODE")
$tp6 = New-Object System.Windows.Forms.TabPage("DASHBOARD")

$tabs.Controls.AddRange(@($tp1,$tp2,$tp3,$tp4,$tp5,$tp6))
foreach($t in $tabs.TabPages) { $t.BackColor = $Global:PanelColor; $t.ForeColor = $Global:FgColor }

# --- TAB 1: PROCESS ---
$pHead = New-Object System.Windows.Forms.Panel; $pHead.Dock = "Top"; $pHead.Height = 60; $tp1.Controls.Add($pHead)
$txtProc = New-Object System.Windows.Forms.TextBox; $txtProc.Dock = "Fill"; $txtProc.Multiline=$true; $txtProc.ScrollBars="Vertical"; 
$txtProc.Font="Consolas,9"; $txtProc.BackColor=$Global:BoxColor; $txtProc.ForeColor=$Global:TxtColor; $tp1.Controls.Add($txtProc)

$btnRef = New-Btn "REFRESH" 120 40 "Cyan" {
    $txtProc.Clear(); $txtProc.AppendText("PID`t`tNAME`t`t`tPRIORITY`r`n" + ("="*70) + "`r`n")
    Get-Process | Sort-Object ProcessName | Select-Object -First 100 | ForEach-Object { $txtProc.AppendText("$($_.Id)`t`t$($_.ProcessName)`t`t$($_.PriorityClass)`r`n") }
}
$btnRef.Location = "10,10"; $pHead.Controls.Add($btnRef)

$txtKill = New-Object System.Windows.Forms.TextBox; $txtKill.Location = "150,18"; $txtKill.Size = "150,25"; $pHead.Controls.Add($txtKill)
$btnKill = New-Btn "KILL" 100 40 "Red" { if($txtKill.Text){ try{ Stop-Process -Name $txtKill.Text -Force; $btnRef.PerformClick() }catch{} } }; $btnKill.Location = "310,10"; $pHead.Controls.Add($btnKill)

# --- TAB 2: REPO FILES ---
$lstRepo = New-Object System.Windows.Forms.ListBox; $lstRepo.Location="20,50"; $lstRepo.Size="880,600"; $lstRepo.BackColor=$Global:BoxColor; $lstRepo.ForeColor=$Global:FgColor; $tp2.Controls.Add($lstRepo)
$btnScan = New-Btn "SCAN FOLDER" 200 50 "Lime" { $lstRepo.Items.Clear(); if(Test-Path $Global:RepoDir){ Get-ChildItem $Global:RepoDir -Recurse | ForEach { $lstRepo.Items.Add($_.FullName) } } }; $btnScan.Location="20,660"; $tp2.Controls.Add($btnScan)
$btnOpen = New-Btn "EXPLORER" 200 50 "Yellow" { Invoke-Item $Global:RepoDir }; $btnOpen.Location="240,660"; $tp2.Controls.Add($btnOpen)

# --- TAB 3: NETWORK ---
$flowNet = New-Object System.Windows.Forms.FlowLayoutPanel; $flowNet.Dock="Fill"; $flowNet.AutoScroll=$true; $tp3.Controls.Add($flowNet)
$netCmds = @(@("Ping Google", "ping google.com"), @("IP Config", "ipconfig /all"), @("Flush DNS", "ipconfig /flushdns"), @("WiFi Passwords", "netsh wlan show profiles"))
foreach($n in $netCmds) { $flowNet.Controls.Add((New-Btn $n[0] 400 50 "LightBlue" { Start-Process cmd "/k $($n[1])" })) }

# --- TAB 4: CLEANER ---
$flowSys = New-Object System.Windows.Forms.FlowLayoutPanel; $flowSys.Dock="Fill"; $flowSys.AutoScroll=$true; $tp4.Controls.Add($flowSys)
$sysCmds = @(@("Empty Bin", "BIN"), @("Clean Temp", "TEMP"), @("Flush RAM", "RAM"), @("Disk Clean", "cleanmgr"))
foreach($s in $sysCmds) { 
    $b = New-Btn $s[0] 400 50 "Orange" {
        if($s[1] -eq "BIN"){ Clear-RecycleBin -Force -ErrorAction SilentlyContinue }
        elseif($s[1] -eq "TEMP"){ Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue }
        elseif($s[1] -eq "RAM"){ [System.GC]::Collect() }
        else { Start-Process cmd "/k $($s[1])" }
    }
    $flowSys.Controls.Add($b)
}

# --- TAB 5: GOD MODE ---
$flowGod = New-Object System.Windows.Forms.FlowLayoutPanel; $flowGod.Dock="Fill"; $flowGod.AutoScroll=$true; $tp5.Controls.Add($flowGod)
$godCmds = @(@("DISM Restore", "DISM /Online /Cleanup-Image /RestoreHealth"), @("SFC Scan", "sfc /scannow"), @("Sys Info", "systeminfo"), @("Registry", "regedit"))
foreach($g in $godCmds) { $flowGod.Controls.Add((New-Btn $g[0] 400 50 "Violet" { Start-Process cmd "/k $($g[1])" -Verb RunAs })) }

# --- TAB 6: DASHBOARD ---
$lblC = New-Object System.Windows.Forms.Label; $lblC.Location="20,40"; $lblC.Size="800,30"; $lblC.Font="Segoe UI,12"; $tp6.Controls.Add($lblC)
$pbC = New-Object System.Windows.Forms.ProgressBar; $pbC.Location="20,70"; $pbC.Size="800,30"; $tp6.Controls.Add($pbC)

$lblM = New-Object System.Windows.Forms.Label; $lblM.Location="20,120"; $lblM.Size="800,30"; $lblM.Font="Segoe UI,12"; $tp6.Controls.Add($lblM)
$pbM = New-Object System.Windows.Forms.ProgressBar; $pbM.Location="20,150"; $pbM.Size="800,30"; $tp6.Controls.Add($pbM)

$tmr = New-Object System.Windows.Forms.Timer; $tmr.Interval=2000; $tmr.Add_Tick({
    $l = (Get-CimInstance Win32_Processor).LoadPercentage
    $lblC.Text = "CPU: $Global:CpuName ($l%)"; $pbC.Value = [int]$l
    $free = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
    $used = [math]::Round($Global:RamTotal - ($free/1024/1024), 1)
    $lblM.Text = "RAM: $used GB / $Global:RamTotal GB"; $pbM.Value = [int](($used/$Global:RamTotal)*100)
}); $tmr.Start()

# --- EXECUTE ---
$btnRef.PerformClick()
$btnScan.PerformClick()
$main.ShowDialog()
