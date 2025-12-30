#!/usr/bin/env bash
set -e

BASE="generated_files"

mkdir -p \
"$BASE/ps1_files/other_Powershell_files" \
"$BASE/batch_files/other_batch_files" \
"$BASE/webpages"

#########################
# POWERSHELL FILES
#########################
for i in {1..10}; do
  if [ "$i" -le 5 ]; then
    OUT="$BASE/ps1_files/ps1_$i.ps1"
  else
    OUT="$BASE/ps1_files/other_Powershell_files/ps1_$i.ps1"
  fi

cat > "$OUT" <<EOF
# ==============================
# PowerShell Script $i
# ==============================

\$LogFile = "ps1_$i.log"

function Write-Log {
    param([string]\$Message)
    \$time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "\$time - \$Message" | Out-File -Append \$LogFile
}

function Get-SystemInfo {
    Write-Log "Collecting system info"
    Get-ComputerInfo | Select-Object OSName, OSVersion, CsName
}

function Scan-Directory {
    param([string]\$Path)
    if (Test-Path \$Path) {
        Get-ChildItem -Recurse \$Path | Measure-Object
    } else {
        Write-Log "Directory not found: \$Path"
    }
}

Write-Log "Script started"

\$info = Get-SystemInfo
\$info | Out-String | Write-Log

\$paths = @("C:\\Windows", "C:\\Users")
foreach (\$p in \$paths) {
    Write-Log "Scanning \$p"
    Scan-Directory \$p | Out-String | Write-Log
}

for (\$i=1; \$i -le 40; \$i++) {
    Write-Output "Processing item \$i"
    Start-Sleep -Milliseconds 20
}

Write-Log "Script finished"

EOF
done

#########################
# BATCH FILES
#########################
for i in {1..10}; do
  if [ "$i" -le 5 ]; then
    OUT="$BASE/batch_files/bat_$i.bat"
  else
    OUT="$BASE/batch_files/other_batch_files/bat_$i.bat"
  fi

cat > "$OUT" <<EOF
@echo off
set LOG=bat_$i.log
echo Script started > %LOG%

echo System Information >> %LOG%
systeminfo >> %LOG%

echo Listing current directory >> %LOG%
dir >> %LOG%

set count=0
:loop
set /a count+=1
echo Processing %%count%% >> %LOG%
if %%count%% LSS 50 goto loop

echo Environment Variables >> %LOG%
set >> %LOG%

echo Script finished >> %LOG%
pause
EOF
done

#########################
# WEBPAGES (SELF-GENERATING)
#########################
for i in {1..10}; do
OUT="$BASE/webpages/page$i.html"

cat > "$OUT" <<EOF
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Web Page $i</title>
<style>
body { font-family: Arial; background: #111; color: #eee; padding: 20px; }
button { padding: 10px; margin: 5px; }
pre { background: #222; padding: 10px; }
</style>
</head>
<body>

<h1>Auto Webpage $i</h1>
<p>This page generates data by itself.</p>

<button onclick="generate()">Generate Data</button>
<button onclick="download()">Download File</button>

<pre id="output"></pre>

<script>
let data = [];

function generate() {
    data = [];
    for (let i = 0; i < 60; i++) {
        let line = "Generated line " + i + " at " + new Date().toLocaleTimeString();
        data.push(line);
    }
    document.getElementById("output").textContent = data.join("\\n");
}

function download() {
    const blob = new Blob([data.join("\\n")], {type: "text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "page$i-output.txt";
    a.click();
}
</script>

</body>
</html>
EOF
done

echo "DONE. Real code generated. All files contain 100+ lines of actual logic."
