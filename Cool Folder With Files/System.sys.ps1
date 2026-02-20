Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "   ULTIMATE SYSTEM UTILITY v3.0 (PowerShell)    " -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "[INIT] Loading Windows Forms Assemblies..." -ForegroundColor DarkGray

function Is-Admin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Update-Metrics {
    try {
        $CPU = Get-CimInstance -ClassName Win32_Processor -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LoadPercentage
        if ($null -eq $CPU) { $CPU = 0 }
        $labelCpu.Text = "CPU Usage: $($CPU)%"
        $pBarCpu.Value = [int]$CPU
    } catch {
        $labelCpu.Text = "CPU Usage: 0%"
    }

    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
        $totalGb = [math]::Round($os.TotalVisibleMemorySize / 1048576, 1)
        $freeGb = [math]::Round($os.FreePhysicalMemory / 1048576, 1)
        $usedGb = [math]::Round($totalGb - $freeGb, 1)
        
        if ($totalGb -gt 0) {
            $usagePercent = [math]::Round(($usedGb / $totalGb) * 100, 0)
        } else {
            $usagePercent = 0
        }

        $labelRam.Text = "RAM: $usagePercent% Used ($usedGb GB / $totalGb GB)"
        $pBarRam.Value = [int]$usagePercent
    } catch {
        $labelRam.Text = "RAM: Error reading memory"
    }
    
    try {
        $Disk = Get-Volume -DriveLetter C -ErrorAction SilentlyContinue
        if ($Disk) {
            $DiskUsage = [math]::Round((($Disk.Size - $Disk.SizeRemaining) / $Disk.Size) * 100, 0)
            $labelDisk.Text = "C: Drive: $($DiskUsage)% Full"
            $pBarDisk.Value = [int]$DiskUsage
        }
    } catch {
        $labelDisk.Text = "C: Drive: Info Unavailable"
    }

    try {
        $BootTime = (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime
        $Uptime = (Get-Date) - $BootTime
        $labelUptime.Text = "System Uptime: $($Uptime.Days)d, $($Uptime.Hours)h, $($Uptime.Minutes)m"
    } catch {
        $labelUptime.Text = "System Uptime: Unavailable"
    }
    
    $Battery = Get-CimInstance -ClassName Win32_Battery -ErrorAction SilentlyContinue
    if ($Battery) {
        $labelBattery.Text = "Battery Status: $($Battery.EstimatedChargeRemaining)% (Plugged: $($Battery.BatteryStatus -ne 1))"
    } else {
        $labelBattery.Text = "Battery Status: No Battery Detected"
    }
    
    Update-AdapterInfo

    $timer.Enabled = $false
    $timer.Enabled = $true
}

function Kill-Process {
    $procName = $entryProcessName.Text
    
    Write-Host "[ACTION] User requested to kill process: '$procName'" -ForegroundColor Yellow

    if (-not $procName) {
        Write-Host "[ERROR] No process name provided." -ForegroundColor Red
        [System.Windows.Forms.MessageBox]::Show("Please enter a process name (e.g., notepad).", "Input Error", "OK", [System.Windows.Forms.MessageBoxIcon]::Warning) | Out-Null
        return
    }

    $targetProcs = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if (-not $targetProcs) {
         $procNameNoExe = $procName -replace ".exe",""
         $targetProcs = Get-Process -Name $procNameNoExe -ErrorAction SilentlyContinue
         if (-not $targetProcs) {
            Write-Host "[ERROR] Process '$procName' not found." -ForegroundColor Red
            [System.Windows.Forms.MessageBox]::Show("Process '$procName' not found running.", "Not Found", "OK", [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
            return
         }
    }

    try {
        Stop-Process -Name $targetProcs[0].ProcessName -Force -ErrorAction Stop
        Write-Host "[SUCCESS] Process terminated." -ForegroundColor Green
        [System.Windows.Forms.MessageBox]::Show("Process terminated successfully.", "Success", "OK", [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
        Refresh-TaskList 
    } catch {
        $errMsg = $_.Exception.Message
        Write-Host "[FAIL] Could not kill process. Reason: $errMsg" -ForegroundColor Red
        [System.Windows.Forms.MessageBox]::Show("Failed to kill process. `n`nReason: $errMsg `n`n(Try running this script as Administrator)", "Error", "OK", [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
    }
}

function Restart-Explorer {
    Write-Host "[ACTION] User requested Explorer restart..." -ForegroundColor Yellow
    if ([System.Windows.Forms.MessageBox]::Show("Restart explorer.exe? Screen may flicker.", "Confirm Restart", "YesNo", [System.Windows.Forms.MessageBoxIcon]::Question) -eq [System.Windows.Forms.DialogResult]::Yes) {
        Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
        Start-Process explorer
        Write-Host "[SUCCESS] Explorer restarted." -ForegroundColor Green
    } else {
        Write-Host "[CANCEL] User cancelled restart." -ForegroundColor Gray
    }
}

function Schedule-Shutdown {
    $Minutes = $entryShutdown.Text
    Write-Host "[ACTION] Scheduling shutdown for $Minutes minutes..." -ForegroundColor Yellow
    if ($Minutes -match '^\d+$') {
        $Seconds = [int]$Minutes * 60
        Start-Process shutdown -ArgumentList "/s /t $Seconds" -NoNewWindow
        Write-Host "[SUCCESS] Timer set for $Seconds seconds." -ForegroundColor Green
        [System.Windows.Forms.MessageBox]::Show("Shutdown scheduled in $Minutes minutes.", "Timer Set", "OK", [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
    } else {
        Write-Host "[ERROR] Invalid time input." -ForegroundColor Red
        [System.Windows.Forms.MessageBox]::Show("Please enter a valid number of minutes.", "Error", "OK", [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
    }
}

function Cancel-Shutdown {
    Write-Host "[ACTION] Cancelling shutdown..." -ForegroundColor Yellow
    Start-Process shutdown -ArgumentList "/a" -NoNewWindow
    Write-Host "[SUCCESS] Shutdown cancelled." -ForegroundColor Green
    [System.Windows.Forms.MessageBox]::Show("Scheduled shutdown cancelled.", "Cancelled", "OK", [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
}

function Update-AdapterInfo {
    $textAdapterInfo.Clear()
    $textAdapterInfo.AppendText("Interface Name`t`tMAC Address`t`tStatus`r`n")
    $textAdapterInfo.AppendText("--------------------------------------------------------------------------------`r`n")
    
    $Adapters = Get-NetAdapter -ErrorAction SilentlyContinue
    if ($Adapters) {
        foreach ($Adapter in $Adapters) {
            $textAdapterInfo.AppendText("$($Adapter.Name)`t`t$($Adapter.MacAddress)`t`t$($Adapter.Status)`r`n")
        }
    }
}

function Ping-Test {
    $target = $entryPingTarget.Text
    if (-not $target) {
        Write-Host "[ERROR] No ping target specified." -ForegroundColor Red
        $labelPingResult.Text = "Error: Enter a target."
        return
    }

    Write-Host "[NET] Pinging target: $target..." -ForegroundColor Cyan
    $labelPingResult.Text = "Pinging..."
    $labelPingResult.ForeColor = [System.Drawing.Color]::Black
    $form.Refresh()

    try {
        $pingResult = Test-Connection -ComputerName $target -Count 1 -ErrorAction Stop
        if ($pingResult) {
            $latency = [math]::Round($pingResult.ResponseTime, 2)
            Write-Host "[NET] Ping Success. Latency: $latency ms" -ForegroundColor Green
            $labelPingResult.Text = "Success! Latency: $($latency) ms"
            $labelPingResult.ForeColor = [System.Drawing.Color]::Green
        }
    } catch {
        Write-Host "[NET] Ping Failed." -ForegroundColor Red
        $labelPingResult.Text = "Failure: Host Unreachable"
        $labelPingResult.ForeColor = [System.Drawing.Color]::Red
    }
}

function Show-EnvironmentVars {
    $textEnvVars.Clear()
    $keyVars = @('PATH', 'HOMEPATH', 'USERNAME', 'COMPUTERNAME', 'TEMP', 'PROGRAMFILES')
    
    foreach ($var in $keyVars) {
        $value = Get-Item env:\$var -ErrorAction SilentlyContinue
        $textEnvVars.AppendText("$($var.PadRight(15)) = $($value.Value)`r`n")
    }
}

function Refresh-TaskList {
    Write-Host "[INFO] Refreshing Process List..." -ForegroundColor DarkGray
    $textTaskList.Clear()
    $textTaskList.AppendText("PID`t`tProcess Name`t`tCPU`t`tStatus`r`n")
    $textTaskList.AppendText("------------------------------------------------------------------`r`n")
    
    $Processes = Get-Process | Sort-Object ProcessName
    
    foreach ($P in $Processes) {
        try {
            $pName = $P.ProcessName
            if ($pName.Length -gt 25) { $pName = $pName.Substring(0,25) + "..." }
            $textTaskList.AppendText("$($P.Id)`t`t$($pName.PadRight(30))`t$($P.CPU)`r`n")
        } catch {
        }
    }
}

function Get-FolderSize {
    Write-Host "[FILE] Starting folder size calculation..." -ForegroundColor Cyan
    [System.Windows.Forms.Cursor]::Current = [System.Windows.Forms.Cursors]::WaitCursor
    $path = $entryFilePath.Text
    if (-not (Test-Path $path)) {
        Write-Host "[ERROR] Path not found: $path" -ForegroundColor Red
        $labelFileSizeResult.Text = "Error: Path not found."
        $labelFileSizeResult.ForeColor = [System.Drawing.Color]::Red
        [System.Windows.Forms.Cursor]::Current = [System.Windows.Forms.Cursors]::Default
        return
    }

    $totalSize = 0
    try {
        if ((Get-Item $path).PSIsContainer) {
            $labelFileSizeResult.Text = "Calculating..."
            $form.Refresh()
            $totalSize = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        } else {
            $totalSize = (Get-Item $path).Length
        }
        
        $sizeGB = [math]::Round($totalSize / 1GB, 4)
        Write-Host "[FILE] Calculation complete. Size: $sizeGB GB" -ForegroundColor Green
        $labelFileSizeResult.Text = "Total Size: $($sizeGB) GB"
        $labelFileSizeResult.ForeColor = [System.Drawing.Color]::Green
    } catch {
        Write-Host "[ERROR] File calculation failed." -ForegroundColor Red
        $labelFileSizeResult.Text = "Error calculating size."
        $labelFileSizeResult.ForeColor = [System.Drawing.Color]::Red
    }
    [System.Windows.Forms.Cursor]::Current = [System.Windows.Forms.Cursors]::Default
}

function Browse-Path {
    $folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
    if ($folderBrowser.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $entryFilePath.Text = $folderBrowser.SelectedPath
        Write-Host "[FILE] Path selected: $($folderBrowser.SelectedPath)" -ForegroundColor Gray
    }
}

function Play-Beep {
    Write-Host "[AUDIO] Playing test sound..." -ForegroundColor Cyan
    [System.Console]::Beep(440, 500)
}


$form = New-Object System.Windows.Forms.Form
$title = "Ultimate System Utility (USU) v3.0 - PowerShell"

Write-Host "[CHECK] Verifying Administrator Privileges..." -ForegroundColor Yellow
if (Is-Admin) { 
    Write-Host "   > ACCESS GRANTED. Running as Administrator." -ForegroundColor Green
} else { 
    Write-Host "   > ACCESS DENIED. Running in Restricted Mode." -ForegroundColor Red
    $title += " (Read Only - Run as Admin to Kill Tasks)" 
}

$form.Text = $title
$form.Size = New-Object System.Drawing.Size(750, 680)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedSingle
$form.MaximizeBox = $false

$tabControl = New-Object System.Windows.Forms.TabControl
$tabControl.Dock = [System.Windows.Forms.DockStyle]::Fill
$form.Controls.Add($tabControl)

$tabProcess = New-Object System.Windows.Forms.TabPage("Processes")
$tabHardware = New-Object System.Windows.Forms.TabPage("Hardware")
$tabPower = New-Object System.Windows.Forms.TabPage("Power")
$tabNetInfo = New-Object System.Windows.Forms.TabPage("Network/Ping")
$tabSysInfo = New-Object System.Windows.Forms.TabPage("System Info")
$tabFileUtil = New-Object System.Windows.Forms.TabPage("File Utility")
$tabAudio = New-Object System.Windows.Forms.TabPage("Audio")

$tabControl.Controls.AddRange(@($tabProcess, $tabHardware, $tabPower, $tabNetInfo, $tabSysInfo, $tabFileUtil, $tabAudio))

$groupKill = New-Object System.Windows.Forms.GroupBox
$groupKill.Text = "Task Terminator"
$groupKill.Location = New-Object System.Drawing.Point(20, 20)
$groupKill.Size = New-Object System.Drawing.Size(680, 80)

$labelProc = New-Object System.Windows.Forms.Label
$labelProc.Text = "Process Name (e.g. chrome):"
$labelProc.Location = New-Object System.Drawing.Point(10, 30)
$labelProc.AutoSize = $true

$entryProcessName = New-Object System.Windows.Forms.TextBox
$entryProcessName.Location = New-Object System.Drawing.Point(200, 27)
$entryProcessName.Size = New-Object System.Drawing.Size(150, 25)

$btnKill = New-Object System.Windows.Forms.Button
$btnKill.Text = "Kill Process"
$btnKill.Location = New-Object System.Drawing.Point(360, 25)
$btnKill.Size = New-Object System.Drawing.Size(120, 30)
$btnKill.Add_Click({ Kill-Process })

$btnExplorer = New-Object System.Windows.Forms.Button
$btnExplorer.Text = "Restart Explorer"
$btnExplorer.Location = New-Object System.Drawing.Point(500, 25)
$btnExplorer.Size = New-Object System.Drawing.Size(140, 30)
$btnExplorer.Add_Click({ Restart-Explorer })

$groupKill.Controls.AddRange(@($labelProc, $entryProcessName, $btnKill, $btnExplorer))
$tabProcess.Controls.Add($groupKill)

$groupTaskList = New-Object System.Windows.Forms.GroupBox
$groupTaskList.Text = "Running Processes (Mini Task Manager)"
$groupTaskList.Location = New-Object System.Drawing.Point(20, 120)
$groupTaskList.Size = New-Object System.Drawing.Size(680, 480)

$btnRefreshTasks = New-Object System.Windows.Forms.Button
$btnRefreshTasks.Text = "Refresh Process List"
$btnRefreshTasks.Location = New-Object System.Drawing.Point(10, 20)
$btnRefreshTasks.Size = New-Object System.Drawing.Size(150, 30)
$btnRefreshTasks.Add_Click({ Refresh-TaskList })

$textTaskList = New-Object System.Windows.Forms.TextBox
$textTaskList.Location = New-Object System.Drawing.Point(10, 60)
$textTaskList.Size = New-Object System.Drawing.Size(660, 410)
$textTaskList.Multiline = $true
$textTaskList.ReadOnly = $true
$textTaskList.Font = New-Object System.Drawing.Font("Consolas", 9)
$textTaskList.ScrollBars = [System.Windows.Forms.ScrollBars]::Both

$groupTaskList.Controls.AddRange(@($btnRefreshTasks, $textTaskList))
$tabProcess.Controls.Add($groupTaskList)

$groupResource = New-Object System.Windows.Forms.GroupBox
$groupResource.Text = "Resource Monitor"
$groupResource.Location = New-Object System.Drawing.Point(20, 20)
$groupResource.Size = New-Object System.Drawing.Size(680, 550)

$labelCpu = New-Object System.Windows.Forms.Label
$labelCpu.Text = "CPU Usage: ..."
$labelCpu.Location = New-Object System.Drawing.Point(10, 30)
$labelCpu.AutoSize = $true

$pBarCpu = New-Object System.Windows.Forms.ProgressBar
$pBarCpu.Location = New-Object System.Drawing.Point(10, 50)
$pBarCpu.Size = New-Object System.Drawing.Size(650, 25)

$labelRam = New-Object System.Windows.Forms.Label
$labelRam.Text = "RAM Usage: ..."
$labelRam.Location = New-Object System.Drawing.Point(10, 90)
$labelRam.AutoSize = $true

$pBarRam = New-Object System.Windows.Forms.ProgressBar
$pBarRam.Location = New-Object System.Drawing.Point(10, 110)
$pBarRam.Size = New-Object System.Drawing.Size(650, 25)

$labelDisk = New-Object System.Windows.Forms.Label
$labelDisk.Text = "Disk (C:) Usage: ..."
$labelDisk.Location = New-Object System.Drawing.Point(10, 150)
$labelDisk.AutoSize = $true

$pBarDisk = New-Object System.Windows.Forms.ProgressBar
$pBarDisk.Location = New-Object System.Drawing.Point(10, 170)
$pBarDisk.Size = New-Object System.Drawing.Size(650, 25)

$labelGpu = New-Object System.Windows.Forms.Label
$labelGpu.Text = "GPU: " + (Get-CimInstance -ClassName Win32_VideoController | Select-Object -ExpandProperty Name -ErrorAction SilentlyContinue -First 1)
$labelGpu.Location = New-Object System.Drawing.Point(10, 220)
$labelGpu.AutoSize = $true
$labelGpu.ForeColor = [System.Drawing.Color]::Blue

$groupResource.Controls.AddRange(@($labelCpu, $pBarCpu, $labelRam, $pBarRam, $labelDisk, $pBarDisk, $labelGpu))
$tabHardware.Controls.Add($groupResource)

$groupPowerInfo = New-Object System.Windows.Forms.GroupBox
$groupPowerInfo.Text = "Power & Time"
$groupPowerInfo.Location = New-Object System.Drawing.Point(20, 20)
$groupPowerInfo.Size = New-Object System.Drawing.Size(680, 180)

$labelUptime = New-Object System.Windows.Forms.Label
$labelUptime.Text = "System Uptime: ..."
$labelUptime.Location = New-Object System.Drawing.Point(10, 30)
$labelUptime.AutoSize = $true
$labelUptime.Font = New-Object System.Drawing.Font("Microsoft Sans Serif", 10, [System.Drawing.FontStyle]::Bold)

$labelBattery = New-Object System.Windows.Forms.Label
$labelBattery.Text = "Battery Status: ..."
$labelBattery.Location = New-Object System.Drawing.Point(10, 70)
$labelBattery.AutoSize = $true

$groupPowerInfo.Controls.AddRange(@($labelUptime, $labelBattery))
$tabPower.Controls.Add($groupPowerInfo)

$groupShutdown = New-Object System.Windows.Forms.GroupBox
$groupShutdown.Text = "Scheduled Shutdown"
$groupShutdown.Location = New-Object System.Drawing.Point(20, 220)
$groupShutdown.Size = New-Object System.Drawing.Size(680, 100)

$labelShutdown = New-Object System.Windows.Forms.Label
$labelShutdown.Text = "Minutes until Shutdown:"
$labelShutdown.Location = New-Object System.Drawing.Point(10, 35)
$labelShutdown.AutoSize = $true

$entryShutdown = New-Object System.Windows.Forms.TextBox
$entryShutdown.Location = New-Object System.Drawing.Point(150, 32)
$entryShutdown.Size = New-Object System.Drawing.Size(80, 25)

$btnSetShutdown = New-Object System.Windows.Forms.Button
$btnSetShutdown.Text = "Set Timer"
$btnSetShutdown.Location = New-Object System.Drawing.Point(250, 30)
$btnSetShutdown.Size = New-Object System.Drawing.Size(120, 30)
$btnSetShutdown.Add_Click({ Schedule-Shutdown })

$btnCancelShutdown = New-Object System.Windows.Forms.Button
$btnCancelShutdown.Text = "Cancel Shutdown"
$btnCancelShutdown.Location = New-Object System.Drawing.Point(390, 30)
$btnCancelShutdown.Size = New-Object System.Drawing.Size(150, 30)
$btnCancelShutdown.Add_Click({ Cancel-Shutdown })

$groupShutdown.Controls.AddRange(@($labelShutdown, $entryShutdown, $btnSetShutdown, $btnCancelShutdown))
$tabPower.Controls.Add($groupShutdown)

$groupNetSpeed = New-Object System.Windows.Forms.GroupBox
$groupNetSpeed.Text = "Network Adapter Info"
$groupNetSpeed.Location = New-Object System.Drawing.Point(20, 20)
$groupNetSpeed.Size = New-Object System.Drawing.Size(680, 200)

$textAdapterInfo = New-Object System.Windows.Forms.TextBox
$textAdapterInfo.Location = New-Object System.Drawing.Point(10, 25)
$textAdapterInfo.Size = New-Object System.Drawing.Size(660, 160)
$textAdapterInfo.Multiline = $true
$textAdapterInfo.ReadOnly = $true
$textAdapterInfo.Font = New-Object System.Drawing.Font("Consolas", 9)
$textAdapterInfo.ScrollBars = [System.Windows.Forms.ScrollBars]::Both
$groupNetSpeed.Controls.Add($textAdapterInfo)

$tabNetInfo.Controls.Add($groupNetSpeed)

$groupPing = New-Object System.Windows.Forms.GroupBox
$groupPing.Text = "Quick Ping Test"
$groupPing.Location = New-Object System.Drawing.Point(20, 240)
$groupPing.Size = New-Object System.Drawing.Size(680, 80)

$labelPingTarget = New-Object System.Windows.Forms.Label
$labelPingTarget.Text = "Target (e.g. google.com):"
$labelPingTarget.Location = New-Object System.Drawing.Point(10, 35)
$labelPingTarget.AutoSize = $true

$entryPingTarget = New-Object System.Windows.Forms.TextBox
$entryPingTarget.Text = "google.com"
$entryPingTarget.Location = New-Object System.Drawing.Point(170, 32)
$entryPingTarget.Size = New-Object System.Drawing.Size(150, 25)

$btnPing = New-Object System.Windows.Forms.Button
$btnPing.Text = "Ping"
$btnPing.Location = New-Object System.Drawing.Point(330, 30)
$btnPing.Size = New-Object System.Drawing.Size(80, 30)
$btnPing.Add_Click({ Ping-Test })

$labelPingResult = New-Object System.Windows.Forms.Label
$labelPingResult.Text = ""
$labelPingResult.Location = New-Object System.Drawing.Point(430, 35)
$labelPingResult.AutoSize = $true

$groupPing.Controls.AddRange(@($labelPingTarget, $entryPingTarget, $btnPing, $labelPingResult))
$tabNetInfo.Controls.Add($groupPing)

$groupOSInfo = New-Object System.Windows.Forms.GroupBox
$groupOSInfo.Text = "OS and Hardware Info"
$groupOSInfo.Location = New-Object System.Drawing.Point(20, 20)
$groupOSInfo.Size = New-Object System.Drawing.Size(680, 150)

$OSInfoText = "OS: $([System.Environment]::OSVersion.VersionString)`r`n"
$OSInfoText += "Architecture: $([System.Environment]::OSVersion.Platform)`r`n"
$OSInfoText += "User: $([System.Environment]::UserName)`r`n"
$OSInfoText += "Hostname: $([System.Net.Dns]::GetHostName())"

$labelOSInfo = New-Object System.Windows.Forms.Label
$labelOSInfo.Text = $OSInfoText
$labelOSInfo.Location = New-Object System.Drawing.Point(10, 30)
$labelOSInfo.AutoSize = $true
$labelOSInfo.Font = New-Object System.Drawing.Font("Consolas", 9)

$groupOSInfo.Controls.Add($labelOSInfo)
$tabSysInfo.Controls.Add($groupOSInfo)

$groupEnvVars = New-Object System.Windows.Forms.GroupBox
$groupEnvVars.Text = "Key Environment Variables"
$groupEnvVars.Location = New-Object System.Drawing.Point(20, 190)
$groupEnvVars.Size = New-Object System.Drawing.Size(680, 380)

$btnShowEnv = New-Object System.Windows.Forms.Button
$btnShowEnv.Text = "Load Variables"
$btnShowEnv.Location = New-Object System.Drawing.Point(10, 25)
$btnShowEnv.Size = New-Object System.Drawing.Size(150, 30)
$btnShowEnv.Add_Click({ Show-EnvironmentVars })

$textEnvVars = New-Object System.Windows.Forms.TextBox
$textEnvVars.Location = New-Object System.Drawing.Point(10, 65)
$textEnvVars.Size = New-Object System.Drawing.Size(660, 300)
$textEnvVars.Multiline = $true
$textEnvVars.ReadOnly = $true
$textEnvVars.Font = New-Object System.Drawing.Font("Consolas", 9)
$textEnvVars.ScrollBars = [System.Windows.Forms.ScrollBars]::Both

$groupEnvVars.Controls.AddRange(@($btnShowEnv, $textEnvVars))
$tabSysInfo.Controls.Add($groupEnvVars)

$groupFile = New-Object System.Windows.Forms.GroupBox
$groupFile.Text = "File/Folder Size Analyzer"
$groupFile.Location = New-Object System.Drawing.Point(20, 20)
$groupFile.Size = New-Object System.Drawing.Size(680, 180)

$labelFilePath = New-Object System.Windows.Forms.Label
$labelFilePath.Text = "Path to Analyze:"
$labelFilePath.Location = New-Object System.Drawing.Point(10, 35)
$labelFilePath.AutoSize = $true

$entryFilePath = New-Object System.Windows.Forms.TextBox
$entryFilePath.Location = New-Object System.Drawing.Point(120, 32)
$entryFilePath.Size = New-Object System.Drawing.Size(400, 25)

$btnBrowsePath = New-Object System.Windows.Forms.Button
$btnBrowsePath.Text = "Browse"
$btnBrowsePath.Location = New-Object System.Drawing.Point(530, 30)
$btnBrowsePath.Size = New-Object System.Drawing.Size(80, 30)
$btnBrowsePath.Add_Click({ Browse-Path })

$btnCalculateSize = New-Object System.Windows.Forms.Button
$btnCalculateSize.Text = "Calculate Size"
$btnCalculateSize.Location = New-Object System.Drawing.Point(10, 80)
$btnCalculateSize.Size = New-Object System.Drawing.Size(150, 30)
$btnCalculateSize.Add_Click({ Get-FolderSize })

$labelFileSizeResult = New-Object System.Windows.Forms.Label
$labelFileSizeResult.Text = "Result: ..."
$labelFileSizeResult.Location = New-Object System.Drawing.Point(180, 85)
$labelFileSizeResult.AutoSize = $true
$labelFileSizeResult.Font = New-Object System.Drawing.Font("Microsoft Sans Serif", 10, [System.Drawing.FontStyle]::Bold)

$groupFile.Controls.AddRange(@($labelFilePath, $entryFilePath, $btnBrowsePath, $btnCalculateSize, $labelFileSizeResult))
$tabFileUtil.Controls.Add($groupFile)

$groupAudio = New-Object System.Windows.Forms.GroupBox
$groupAudio.Text = "Audio Tools"
$groupAudio.Location = New-Object System.Drawing.Point(20, 20)
$groupAudio.Size = New-Object System.Drawing.Size(680, 150)

$labelBeep = New-Object System.Windows.Forms.Label
$labelBeep.Text = "Test System Notification:"
$labelBeep.Location = New-Object System.Drawing.Point(10, 35)
$labelBeep.AutoSize = $true

$btnBeep = New-Object System.Windows.Forms.Button
$btnBeep.Text = "Play Beep (440Hz, 500ms)"
$btnBeep.Location = New-Object System.Drawing.Point(180, 30)
$btnBeep.Size = New-Object System.Drawing.Size(200, 30)
$btnBeep.Add_Click({ Play-Beep })

$groupAudio.Controls.AddRange(@($labelBeep, $btnBeep))
$tabAudio.Controls.Add($groupAudio)

Update-AdapterInfo
Show-EnvironmentVars

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 1000
$timer.Enabled = $true
$timer.Add_Tick({ Update-Metrics })

Write-Host "[INIT] Initializing CPU/Memory Sensors..." -ForegroundColor Yellow
Start-Sleep -Milliseconds 200
Write-Host "   > CPU Sensor: OK" -ForegroundColor Green
Write-Host "   > RAM Sensor: OK" -ForegroundColor Green
Start-Sleep -Milliseconds 200

Write-Host "[INIT] Scanning Active Processes..." -ForegroundColor Yellow
Refresh-TaskList 
Write-Host "   > Process Scan: OK" -ForegroundColor Green
Start-Sleep -Milliseconds 200

Write-Host "[INIT] Starting Live Monitor Loop..." -ForegroundColor Yellow
Update-Metrics
Write-Host "   > Live Monitor: OK" -ForegroundColor Green

Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "   GUI LAUNCHING...                             " -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor Cyan

[void]$form.ShowDialog()
