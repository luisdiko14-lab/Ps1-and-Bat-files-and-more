<#
    ULTIMATE SYSTEM UTILITY v10.0 - SYSTEM BOOT EDITION
    - Auto-Admin Elevation
    - "OS-Style" Boot Sequence (Simulated File Creation)
    - Full Feature Set Restored (Audio, Power, Network, Files)
    - "Others" Admin Tab included
#>

# ==============================================================================
# 1. AUTO-ADMIN ELEVATION (SYSTEM ROOT CHECK)
# ==============================================================================
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting Administrator Privileges..." -ForegroundColor Yellow
    try {
        Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        Exit
    } catch {
        Write-Host "Failed to elevate. Please run as Administrator manually." -ForegroundColor Red
        Break
    }
}

# Load Assemblies
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ==============================================================================
# 2. SYSTEM BOOT LOADER (SPLASH SCREEN)
# ==============================================================================

$splashForm = New-Object System.Windows.Forms.Form
$splashForm.Text = "Booting..."
$splashForm.Size = New-Object System.Drawing.Size(600, 200)
$splashForm.StartPosition = "CenterScreen"
$splashForm.FormBorderStyle = "None"
$splashForm.BackColor = [System.Drawing.Color]::Black

$splashTitle = New-Object System.Windows.Forms.Label
$splashTitle.Text = "SYSTEM BOOTLOADER v10.0"
$splashTitle.Font = New-Object System.Drawing.Font("Consolas", 14, [System.Drawing.FontStyle]::Bold)
$splashTitle.ForeColor = [System.Drawing.Color]::LimeGreen
$splashTitle.Location = New-Object System.Drawing.Point(20, 20); $splashTitle.AutoSize = $true
$splashForm.Controls.Add($splashTitle)

$splashStatus = New-Object System.Windows.Forms.Label
$splashStatus.Text = "Initializing Kernel..."
$splashStatus.Font = New-Object System.Drawing.Font("Consolas", 10)
$splashStatus.ForeColor = [System.Drawing.Color]::White
$splashStatus.Location = New-Object System.Drawing.Point(20, 60); $splashStatus.AutoSize = $true
$splashForm.Controls.Add($splashStatus)

$splashBar = New-Object System.Windows.Forms.ProgressBar
$splashBar.Location = New-Object System.Drawing.Point(20, 150); $splashBar.Size = New-Object System.Drawing.Size(560, 5); $splashBar.Style = "Continuous"
$splashForm.Controls.Add($splashBar)

$splashForm.Show()
$splashForm.Refresh()

# --- BOOT SEQUENCE SIMULATION ---

# 1. Sys.Config
$splashStatus.Text = "> Generating sys.config... [SET RUNAS=ADMIN]"
$splashBar.Value = 10; $splashForm.Refresh(); Start-Sleep -Milliseconds 400

# 2. Sys.Ini
$splashStatus.Text = "> Writing sys.ini... [Parameter: NO_GUI_LAG]"
$splashBar.Value = 25; $splashForm.Refresh(); Start-Sleep -Milliseconds 300

# 3. Sys.Batch
$splashStatus.Text = "> Creating sys.batch... [Queueing Modules]"
$splashBar.Value = 40; $splashForm.Refresh(); Start-Sleep -Milliseconds 300

# 4. Sys.PS1
$splashStatus.Text = "> Compiling sys.ps1... [Linking Hardware]"
$splashBar.Value = 55; $splashForm.Refresh(); Start-Sleep -Milliseconds 300

# 5. REAL Hardware Fetching (Hidden behind the "Loading" text)
$splashStatus.Text = "> Mounting Hardware Sensors (CPU/GPU)..."
try {
    $CpuObj = Get-CimInstance -ClassName Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
    $Global:CpuName = $CpuObj.Name.Trim()
} catch { $Global:CpuName = "Unknown CPU" }
$splashBar.Value = 70; $splashForm.Refresh()

try {
    $GpuObj = Get-CimInstance -ClassName Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -First 1
    $Global:GpuName = $GpuObj.Name.Trim()
} catch { $Global:GpuName = "Unknown GPU" }
$splashBar.Value = 85; $splashForm.Refresh()

try {
    $OsObj = Get-CimInstance -ClassName Win32_OperatingSystem
    $Global:TotalRamGB = [math]::Round($OsObj.TotalVisibleMemorySize / 1048576, 1)
} catch { $Global:TotalRamGB = 0 }

# 6. Final Execution
$splashStatus.Text = "> EXECUTE: system.v10.0.sys.ps1"
$splashBar.Value = 100; $splashForm.Refresh(); Start-Sleep -Milliseconds 800

$splashForm.Close()
$splashForm.Dispose()

# --- LAUNCH CONFIRMATION BOX ---
[System.Windows.Forms.MessageBox]::Show("Launching sys.ps1...`n`nTarget: system.v10.0.sys.ps1", "System Loader", "OK", "Information") | Out-Null


# ==============================================================================
# 3. MAIN SYSTEM FUNCTIONS (RESTORED)
# ==============================================================================

function Update-Metrics {
    # CPU
    try {
        $CPU = Get-CimInstance -ClassName Win32_Processor | Select-Object -ExpandProperty LoadPercentage
        $pBarCpu.Value = [int]$CPU
        $labelCpu.Text = "$Global:CpuName `r`nUsage: $($CPU)%"
    } catch { $pBarCpu.Value = 0 }
    # RAM
    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem
        $freeGb = [math]::Round($os.FreePhysicalMemory / 1048576, 1)
        $usedGb = [math]::Round($Global:TotalRamGB - $freeGb, 1)
        if ($Global:TotalRamGB -gt 0) { $usagePercent = [math]::Round(($usedGb / $Global:TotalRamGB) * 100, 0) } else { $usagePercent = 0 }
        $pBarRam.Value = [int]$usagePercent
        $labelRam.Text = "RAM: $usagePercent% Used ($usedGb GB / $Global:TotalRamGB GB)"
    } catch { $pBarRam.Value = 0 }
    # Uptime
    try {
        $BootTime = (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime
        $Uptime = (Get-Date) - $BootTime
        $labelUptime.Text = "System Uptime: $($Uptime.Days)d, $($Uptime.Hours)h, $($Uptime.Minutes)m"
    } catch { }
    $timer.Enabled = $false; $timer.Enabled = $true
}

function Kill-Process {
    $procName = $entryProcessName.Text
    if (-not $procName) { [System.Windows.Forms.MessageBox]::Show("Enter name.", "Error", "OK", "Error"); return }
    $target = Get-Process -Name ($procName -replace ".exe","") -ErrorAction SilentlyContinue
    if ($target) { Stop-Process -Name $target[0].ProcessName -Force; Refresh-TaskList }
}

function Refresh-TaskList {
    $textTaskList.Clear()
    $textTaskList.AppendText("PID`t`tProcess Name`t`tCPU`r`n--------------------------------------------`r`n")
    Get-Process | Sort-Object ProcessName | Select-Object -First 50 | ForEach-Object {
        $textTaskList.AppendText("$($_.Id)`t`t$($_.ProcessName.PadRight(25))`t$($_.CPU)`r`n")
    }
}

function Schedule-Shutdown {
    $Minutes = $entryShutdown.Text
    if ($Minutes -match '^\d+$') {
        $Seconds = [int]$Minutes * 60
        Start-Process shutdown -ArgumentList "/s /t $Seconds" -NoNewWindow
        [System.Windows.Forms.MessageBox]::Show("Shutdown in $Minutes mins.", "Timer Set", "OK", "Information")
    }
}

function Cancel-Shutdown { Start-Process shutdown -ArgumentList "/a" -NoNewWindow; [System.Windows.Forms.MessageBox]::Show("Shutdown Cancelled.", "Info", "OK", "Information") }

function Play-Beep { [System.Console]::Beep(440, 500) }

function Ping-Test {
    $target = $entryPingTarget.Text; if (-not $target) { return }
    try {
        $res = Test-Connection -ComputerName $target -Count 1 -ErrorAction Stop
        [System.Windows.Forms.MessageBox]::Show("Ping Success! Time: $($res.ResponseTime)ms", "Network", "OK", "Information")
    } catch { [System.Windows.Forms.MessageBox]::Show("Ping Failed.", "Network", "OK", "Error") }
}

function Open-ExtraToolsWindow {
    $subForm = New-Object System.Windows.Forms.Form
    $subForm.Text = "Advanced Options (Admin)"
    $subForm.Size = New-Object System.Drawing.Size(400, 400); $subForm.StartPosition = "CenterParent"
    
    $lbl = New-Object System.Windows.Forms.Label; $lbl.Text = "Select Task:"; $lbl.Location = "20,20"; $lbl.AutoSize = $true
    
    $b1 = New-Object System.Windows.Forms.Button; $b1.Text = "DISM Repair"; $b1.Location = "50,60"; $b1.Size = "280,40"
    $b1.Add_Click({ Start-Process cmd -ArgumentList "/k DISM /Online /Cleanup-Image /RestoreHealth" -Verb RunAs; $subForm.Close() })

    $b2 = New-Object System.Windows.Forms.Button; $b2.Text = "Reset Winsock"; $b2.Location = "50,110"; $b2.Size = "280,40"
    $b2.Add_Click({ Start-Process cmd -ArgumentList "/k netsh winsock reset" -Verb RunAs; $subForm.Close() })
    
    $b3 = New-Object System.Windows.Forms.Button; $b3.Text = "Export Drivers"; $b3.Location = "50,160"; $b3.Size = "280,40"
    $b3.Add_Click({ New-Item -Path "C:\DriversBackup" -ItemType Directory -Force | Out-Null; Start-Process cmd -ArgumentList "/k pnputil /export-driver * C:\DriversBackup" -Verb RunAs; $subForm.Close() })

    $subForm.Controls.AddRange(@($lbl, $b1, $b2, $b3)); $subForm.ShowDialog()
}

function Open-Tool($cmd) { Start-Process $cmd -ErrorAction SilentlyContinue }

# ==============================================================================
# 4. MAIN GUI CONSTRUCTION (FULL SUITE)
# ==============================================================================

$form = New-Object System.Windows.Forms.Form
$form.Text = "Ultimate System Utility v10.0 (sys.ps1 Executed)"
$form.Size = New-Object System.Drawing.Size(750, 750)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedSingle'
$form.MaximizeBox = $false

$tabControl = New-Object System.Windows.Forms.TabControl; $tabControl.Dock = 'Fill'; $form.Controls.Add($tabControl)
$tabHardware = New-Object System.Windows.Forms.TabPage("Hardware")
$tabProcess = New-Object System.Windows.Forms.TabPage("Processes")
$tabPower = New-Object System.Windows.Forms.TabPage("Power")
$tabNet = New-Object System.Windows.Forms.TabPage("Network")
$tabAudio = New-Object System.Windows.Forms.TabPage("Audio")
$tabOthers = New-Object System.Windows.Forms.TabPage("OTHERS")

$tabControl.Controls.AddRange(@($tabHardware, $tabProcess, $tabPower, $tabNet, $tabAudio, $tabOthers))

# --- HARDWARE TAB ---
$grpSpec = New-Object System.Windows.Forms.GroupBox; $grpSpec.Text = "Live Specs"; $grpSpec.Location = "20,20"; $grpSpec.Size = "680, 500"
$labelCpu = New-Object System.Windows.Forms.Label; $labelCpu.Location = "20,40"; $labelCpu.Size = "640,40"; $labelCpu.Text = "CPU: ..."; $labelCpu.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$pBarCpu = New-Object System.Windows.Forms.ProgressBar; $pBarCpu.Location = "20,80"; $pBarCpu.Size = "640,20"
$labelRam = New-Object System.Windows.Forms.Label; $labelRam.Location = "20,120"; $labelRam.AutoSize = $true; $labelRam.Text = "RAM: ..."; $labelRam.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$pBarRam = New-Object System.Windows.Forms.ProgressBar; $pBarRam.Location = "20,145"; $pBarRam.Size = "640,20"
$labelGpuName = New-Object System.Windows.Forms.Label; $labelGpuName.Location = "20,200"; $labelGpuName.AutoSize = $true; $labelGpuName.Text = "GPU: $Global:GpuName"; $labelGpuName.ForeColor = [System.Drawing.Color]::Blue; $labelGpuName.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$labelUptime = New-Object System.Windows.Forms.Label; $labelUptime.Location = "20,250"; $labelUptime.AutoSize = $true; $labelUptime.Text = "..."; $labelUptime.Font = New-Object System.Drawing.Font("Consolas", 10)
$grpSpec.Controls.AddRange(@($labelCpu, $pBarCpu, $labelRam, $pBarRam, $labelGpuName, $labelUptime))
$tabHardware.Controls.Add($grpSpec)

# --- PROCESS TAB ---
$grpProc = New-Object System.Windows.Forms.GroupBox; $grpProc.Text = "Manager"; $grpProc.Location = "20,20"; $grpProc.Size = "680, 600"
$entryProcessName = New-Object System.Windows.Forms.TextBox; $entryProcessName.Location = "20,30"; $entryProcessName.Size = "200,25"
$btnKill = New-Object System.Windows.Forms.Button; $btnKill.Text = "Kill"; $btnKill.Location = "230,28"; $btnKill.Add_Click({Kill-Process})
$btnRef = New-Object System.Windows.Forms.Button; $btnRef.Text = "Refresh"; $btnRef.Location = "320,28"; $btnRef.Add_Click({Refresh-TaskList})
$textTaskList = New-Object System.Windows.Forms.TextBox; $textTaskList.Location = "20,70"; $textTaskList.Size = "640,500"; $textTaskList.Multiline = $true; $textTaskList.ScrollBars = "Vertical"; $textTaskList.Font = New-Object System.Drawing.Font("Consolas", 9)
$grpProc.Controls.AddRange(@($entryProcessName, $btnKill, $btnRef, $textTaskList))
$tabProcess.Controls.Add($grpProc)

# --- POWER TAB (RESTORED) ---
$grpShutdown = New-Object System.Windows.Forms.GroupBox; $grpShutdown.Text = "Shutdown Timer"; $grpShutdown.Location = "20,20"; $grpShutdown.Size = "680,150"
$lblShut = New-Object System.Windows.Forms.Label; $lblShut.Text = "Minutes:"; $lblShut.Location = "20,40"; $lblShut.AutoSize = $true
$entryShutdown = New-Object System.Windows.Forms.TextBox; $entryShutdown.Location = "100,37"; $entryShutdown.Size = "80,25"
$btnSetShut = New-Object System.Windows.Forms.Button; $btnSetShut.Text = "Set Timer"; $btnSetShut.Location = "200,35"; $btnSetShut.Add_Click({Schedule-Shutdown})
$btnCanShut = New-Object System.Windows.Forms.Button; $btnCanShut.Text = "Cancel"; $btnCanShut.Location = "300,35"; $btnCanShut.Add_Click({Cancel-Shutdown})
$grpShutdown.Controls.AddRange(@($lblShut, $entryShutdown, $btnSetShut, $btnCanShut))
$tabPower.Controls.Add($grpShutdown)

# --- NETWORK TAB (RESTORED) ---
$grpNet = New-Object System.Windows.Forms.GroupBox; $grpNet.Text = "Ping Tool"; $grpNet.Location = "20,20"; $grpNet.Size = "680,150"
$lblPing = New-Object System.Windows.Forms.Label; $lblPing.Text = "Target:"; $lblPing.Location = "20,40"; $lblPing.AutoSize = $true
$entryPingTarget = New-Object System.Windows.Forms.TextBox; $entryPingTarget.Text = "google.com"; $entryPingTarget.Location = "100,37"; $entryPingTarget.Size = "150,25"
$btnPing = New-Object System.Windows.Forms.Button; $btnPing.Text = "Ping"; $btnPing.Location = "270,35"; $btnPing.Add_Click({Ping-Test})
$grpNet.Controls.AddRange(@($lblPing, $entryPingTarget, $btnPing))
$tabNet.Controls.Add($grpNet)

# --- AUDIO TAB (RESTORED) ---
$grpAudio = New-Object System.Windows.Forms.GroupBox; $grpAudio.Text = "Tools"; $grpAudio.Location = "20,20"; $grpAudio.Size = "680,100"
$btnBeep = New-Object System.Windows.Forms.Button; $btnBeep.Text = "Play Beep Sound"; $btnBeep.Location = "20,30"; $btnBeep.Size = "200,40"; $btnBeep.Add_Click({Play-Beep})
$grpAudio.Controls.Add($btnBeep)
$tabAudio.Controls.Add($grpAudio)

# --- OTHERS TAB (NEW) ---
$grpOther = New-Object System.Windows.Forms.GroupBox; $grpOther.Text = "Advanced"; $grpOther.Location = "50, 50"; $grpOther.Size = "600, 300"
$btnOpenOthers = New-Object System.Windows.Forms.Button; $btnOpenOthers.Text = "OPEN OTHER OPTIONS"; $btnOpenOthers.Location = "150, 100"; $btnOpenOthers.Size = "300, 80"; $btnOpenOthers.Font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold); $btnOpenOthers.BackColor = [System.Drawing.Color]::LightBlue
$btnOpenOthers.Add_Click({ Open-ExtraToolsWindow })
$grpOther.Controls.Add($btnOpenOthers)
$tabOthers.Controls.Add($grpOther)

# --- RUN ---
$timer = New-Object System.Windows.Forms.Timer; $timer.Interval = 1000; $timer.Add_Tick({ Update-Metrics }); $timer.Start()
Update-Metrics
Refresh-TaskList
$form.ShowDialog()
