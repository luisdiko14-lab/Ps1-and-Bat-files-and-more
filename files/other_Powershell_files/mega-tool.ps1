
if (-not ([Security.Principal.WindowsPrincipal] 
    [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {

    Start-Process powershell `
        -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" `
        -Verb RunAs
    exit
}


$Global:Logs = @()
$Global:Tasks = @{}
$Global:Files = @{}
$Global:StartTime = Get-Date

# ===========================================
# UTILITIES
# ===========================================

function New-UUID {
    return [guid]::NewGuid().ToString()
}

function Write-Log {
    param (
        [string]$Level,
        [string]$Message
    )

    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$time] [$Level] $Message"
    $Global:Logs += $entry

    switch ($Level) {
        "INFO"  { Write-Host $entry -ForegroundColor Cyan }
        "WARN"  { Write-Host $entry -ForegroundColor Yellow }
        "ERROR" { Write-Host $entry -ForegroundColor Red }
        "DEBUG" { Write-Host $entry -ForegroundColor Magenta }
        default { Write-Host $entry }
    }
}

function Random-Int($min, $max) {
    return Get-Random -Minimum $min -Maximum ($max + 1)
}

function Random-Text($len) {
    $chars = "abcdefghijklmnopqrstuvwxyz"
    -join (1..$len | ForEach-Object { $chars[(Random-Int 0 ($chars.Length - 1))] })
}

# ===========================================
# SYSTEM MONITOR
# ===========================================

function Get-SystemStats {
    $uptime = (Get-Date) - $Global:StartTime

    return [PSCustomObject]@{
        CPU        = (Random-Int 5 95)
        RAM_MB     = (Random-Int 512 32000)
        TEMP_C     = (Random-Int 25 95)
        UPTIME_SEC = [int]$uptime.TotalSeconds
    }
}

function Show-SystemStats {
    $stats = Get-SystemStats
    Write-Log "INFO" "CPU $($stats.CPU)% | RAM $($stats.RAM_MB)MB | TEMP $($stats.TEMP_C)C | UPTIME $($stats.UPTIME_SEC)s"
}

# ===========================================
# FILE SYSTEM SIMULATOR
# ===========================================

function New-VirtualFile {
    param ($Name, $Content)

    $id = New-UUID
    $file = [PSCustomObject]@{
        Id        = $id
        Name      = $Name
        Content   = $Content
        Size      = $Content.Length
        CreatedAt= Get-Date
    }

    $Global:Files[$id] = $file
    Write-Log "INFO" "File created: $Name ($id)"
    return $file
}

function Get-VirtualFiles {
    return $Global:Files.Values
}

function Remove-VirtualFile {
    param ($Id)
    if ($Global:Files.ContainsKey($Id)) {
        $name = $Global:Files[$Id].Name
        $Global:Files.Remove($Id) | Out-Null
        Write-Log "DEBUG" "File removed: $name"
    }
}

# ===========================================
# TASK MANAGER
# ===========================================

function New-Task {
    param ($Name, $Retries, $Timeout)

    $id = New-UUID
    $task = [PSCustomObject]@{
        Id        = $id
        Name      = $Name
        Retries   = $Retries
        Timeout   = $Timeout
        Status    = "pending"
        CreatedAt= Get-Date
    }

    $Global:Tasks[$id] = $task
    Write-Log "INFO" "Task created: $Name ($id)"
    return $task
}

function Run-Task {
    param ($TaskId)

    if (-not $Global:Tasks.ContainsKey($TaskId)) {
        Write-Log "ERROR" "Task not found: $TaskId"
        return
    }

    $task = $Global:Tasks[$TaskId]
    $task.Status = "running"
    Write-Log "INFO" "Task running: $($task.Name)"

    Start-Sleep -Milliseconds (Random-Int 400 1800)

    if ((Random-Int 1 10) -gt 8) {
        $task.Status = "failed"
        Write-Log "ERROR" "Task failed: $($task.Name)"
    } else {
        $task.Status = "completed"
        Write-Log "INFO" "Task completed: $($task.Name)"
    }
}

function Run-AllTasks {
    foreach ($task in $Global:Tasks.Values) {
        Run-Task $task.Id
    }
}

function Clear-CompletedTasks {
    $completed = $Global:Tasks.Values | Where-Object { $_.Status -eq "completed" }
    foreach ($t in $completed) {
        $Global:Tasks.Remove($t.Id) | Out-Null
        Write-Log "DEBUG" "Cleared completed task: $($t.Name)"
    }
}

# ===========================================
# NETWORK TOOLS
# ===========================================

function Send-FakePacket {
    param ($Source, $Destination, $Payload)

    $packet = [PSCustomObject]@{
        Id          = New-UUID
        Source      = $Source
        Destination = $Destination
        Payload     = $Payload
        Time        = Get-Date
    }

    Write-Log "INFO" "Packet sent $($packet.Id) $Source -> $Destination"
}

function Network-Stress {
    for ($i = 0; $i -lt 25; $i++) {
        Send-FakePacket `
            (Random-Text 6) `
            (Random-Text 6) `
            (Random-Text 20)
        Start-Sleep -Milliseconds 60
    }
}

# ===========================================
# LOG VIEWER
# ===========================================
 
function Show-Logs {
    Write-Host ""
    Write-Host "==== LOGS ===="
    foreach ($l in $Global:Logs) {
        Write-Host $l
    }
}

# ===========================================
# DATA DUMP
# ===========================================

function Dump-All {
    Write-Host ""
    Write-Host "==== FILES ===="
    $Global:Files.Values | Format-Table

    Write-Host ""
    Write-Host "==== TASKS ===="
    $Global:Tasks.Values | Format-Table

    Show-Logs
}

# ===========================================
# STRESS TEST
# ===========================================

function Stress-Test {
    Write-Log "INFO" "Stress test started..."

    for ($i = 0; $i -lt 30; $i++) {
        New-VirtualFile "file_$i.txt" (Random-Text 120) | Out-Null
        Start-Sleep -Milliseconds 25
    }

    for ($i = 0; $i -lt 15; $i++) {
        New-Task "Task_$i" 2 3000 | Out-Null
    }

    Run-AllTasks
    Clear-CompletedTasks
    Write-Log "INFO" "Stress test finished"
}

# ===========================================
# MAIN MENU
# ===========================================

function Show-Menu {
    Clear-Host
    Write-Host "============================"
    Write-Host "  MEGA POWERSHELL TOOL"
    Write-Host "============================"
    Write-Host "1) Show System Stats"
    Write-Host "2) Create Random File"
    Write-Host "3) Create Random Task"
    Write-Host "4) Run All Tasks"
    Write-Host "5) Network Stress"
    Write-Host "6) Stress Test"
    Write-Host "7) Dump All Data"
    Write-Host "8) Show Logs"
    Write-Host "9) Exit"
    Write-Host "============================"
}

# ===========================================
# ENTRY LOOP
# ===========================================

Write-Log "INFO" "System booting..."

while ($true) {
    Show-Menu
    $choice = Read-Host "Select"

    switch ($choice) {
        "1" { Show-SystemStats; Pause }
        "2" {
            $name = "file_" + (Random-Text 5) + ".txt"
            New-VirtualFile $name (Random-Text 150) | Out-Null
            Pause
        }
        "3" {
            $tname = "Task_" + (Random-Text 4)
            New-Task $tname 2 2000 | Out-Null
            Pause
        }
        "4" { Run-AllTasks; Pause }
        "5" { Network-Stress; Pause }
        "6" { Stress-Test; Pause }
        "7" { Dump-All; Pause }
        "8" { Show-Logs; Pause }
        "9" { break }
        default { Write-Host "Invalid option"; Start-Sleep 1 }
    }
}

Write-Log "INFO" "System shutdown."
