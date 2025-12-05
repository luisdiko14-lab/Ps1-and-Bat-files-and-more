Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$LogFile = "$env:TEMP\\generator.log"
New-Item -ItemType File -Path $LogFile -Force | Out-Null

function Log($t){ Add-Content -Path $LogFile -Value ("[" + (Get-Date) + "] " + $t) }

$form = New-Object System.Windows.Forms.Form
$form.Text = "Project Generator"
$form.Size = New-Object System.Drawing.Size(820,560)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false

$l1 = New-Object System.Windows.Forms.Label
$l1.Text = "Folder Name"
$l1.Location = New-Object System.Drawing.Point(20,20)
$l1.Size = New-Object System.Drawing.Size(120,24)
$form.Controls.Add($l1)

$t1 = New-Object System.Windows.Forms.TextBox
$t1.Location = New-Object System.Drawing.Point(150,18)
$t1.Size = New-Object System.Drawing.Size(420,26)
$t1.Text = "MyProject"
$form.Controls.Add($t1)

$l2 = New-Object System.Windows.Forms.Label
$l2.Text = "Base Path"
$l2.Location = New-Object System.Drawing.Point(20,60)
$l2.Size = New-Object System.Drawing.Size(120,24)
$form.Controls.Add($l2)

$t2 = New-Object System.Windows.Forms.TextBox
$t2.Location = New-Object System.Drawing.Point(150,58)
$t2.Size = New-Object System.Drawing.Size(420,26)
$t2.Text = [Environment]::GetFolderPath('Desktop')
$form.Controls.Add($t2)

$bBrowse = New-Object System.Windows.Forms.Button
$bBrowse.Text = "Browse"
$bBrowse.Location = New-Object System.Drawing.Point(590,56)
$bBrowse.Size = New-Object System.Drawing.Size(90,28)
$bBrowse.Add_Click({
 $fb = New-Object System.Windows.Forms.FolderBrowserDialog
 $fb.SelectedPath = $t2.Text
 if($fb.ShowDialog() -eq 'OK'){ $t2.Text = $fb.SelectedPath }
})
$form.Controls.Add($bBrowse)

$l3 = New-Object System.Windows.Forms.Label
$l3.Text = "How many files (max 100)"
$l3.Location = New-Object System.Drawing.Point(20,100)
$l3.Size = New-Object System.Drawing.Size(200,24)
$form.Controls.Add($l3)

$numFiles = New-Object System.Windows.Forms.NumericUpDown
$numFiles.Location = New-Object System.Drawing.Point(230,98)
$numFiles.Size = New-Object System.Drawing.Size(120,26)
$numFiles.Minimum = 20
$numFiles.Maximum = 100
$numFiles.Value = 20
$form.Controls.Add($numFiles)

$output = New-Object System.Windows.Forms.TextBox
$output.Location = New-Object System.Drawing.Point(20,140)
$output.Size = New-Object System.Drawing.Size(760,300)
$output.Multiline = $true
$output.ScrollBars = 'Vertical'
$output.ReadOnly = $true
$form.Controls.Add($output)

$progress = New-Object System.Windows.Forms.ProgressBar
$progress.Location = New-Object System.Drawing.Point(20,455)
$progress.Size = New-Object System.Drawing.Size(760,22)
$progress.Minimum = 0
$progress.Maximum = 100
$form.Controls.Add($progress)

$bGen = New-Object System.Windows.Forms.Button
$bGen.Text = "Generate"
$bGen.Location = New-Object System.Drawing.Point(590,18)
$bGen.Size = New-Object System.Drawing.Size(190,30)
$form.Controls.Add($bGen)

$bOpen = New-Object System.Windows.Forms.Button
$bOpen.Text = "Open Folder"
$bOpen.Location = New-Object System.Drawing.Point(590,96)
$bOpen.Size = New-Object System.Drawing.Size(190,30)
$form.Controls.Add($bOpen)

function OutAdd($t){ $output.AppendText($t + "`r`n"); Log $t; Start-Sleep -Milliseconds 120 }

$bGen.Add_Click({
 try{
  $progress.Value = 0
  $output.Clear()

  $name = $t1.Text.Trim()
  $base = $t2.Text.Trim()
  $count = [int]$numFiles.Value

  if([string]::IsNullOrWhiteSpace($name)){ [System.Windows.Forms.MessageBox]::Show("Enter a folder name"); return }
  if(-not (Test-Path $base)){ New-Item -ItemType Directory -Path $base -Force | Out-Null }

  $root = Join-Path $base $name
  if(Test-Path $root){ Remove-Item -Recurse -Force $root }
  New-Item -ItemType Directory -Path $root | Out-Null
  OutAdd "Created root folder"
  $progress.Value = 5

  $folders = @('config','logs','bin','registry','dll','batch','powershell','docs','data','assets')
  foreach($f in $folders){
   $p = Join-Path $root $f
   New-Item -ItemType Directory -Path $p -Force | Out-Null
   OutAdd "Folder: $f"
  }
  $progress.Value = 15

  $readme = "Project $name created on $(Get-Date)"
  Set-Content (Join-Path $root 'README.txt') $readme
  OutAdd "README.txt"

  $batMain = "@echo off`r`necho Starting $name`r`npause"
  Set-Content (Join-Path $root 'batch\\start.bat') $batMain
  OutAdd "start.bat"

  $batConf = "@echo off`r`nset PROJECT=$name`r`necho Config loaded`r`npause"
  Set-Content (Join-Path $root 'config\\configuration.bat') $batConf
  OutAdd "configuration.bat"

  $psMain = "Write-Host 'Running $name'"
  Set-Content (Join-Path $root 'powershell\\main.ps1') $psMain
  OutAdd "main.ps1"

  $psTool = "Get-Date | Out-File logs\\tool.log"
  Set-Content (Join-Path $root 'powershell\\tool.ps1') $psTool
  OutAdd "tool.ps1"

  $reg1 = "Windows Registry Editor Version 5.00`r`n[HKEY_CURRENT_USER\\Software\\$name]`r`n\"Enabled\"=dword:00000001"
  Set-Content (Join-Path $root 'registry\\main.reg') $reg1
  OutAdd "main.reg"

  $reg2 = "Windows Registry Editor Version 5.00`r`n[HKEY_CURRENT_USER\\Software\\$name\\Settings]"
  Set-Content (Join-Path $root 'registry\\settings.reg') $reg2
  OutAdd "settings.reg"

  $dll1 = "{${2}€]$${29}"
  Set-Content (Join-Path $root 'dll\\core.dll') $dll1
  OutAdd "core.dll"

  $dll2 = "{${2}€]$${29}"
  Set-Content (Join-Path $root 'dll\\ui.dll') $dll2
  OutAdd "ui.dll"

  $logInit = "Created on $(Get-Date)"
  Set-Content (Join-Path $root 'logs\\setup.log') $logInit
  OutAdd "setup.log"

  $json = "{`r`n  \"name\": \"$name\",`r`n  \"version\": \"1.0\"`r`n}"
  Set-Content (Join-Path $root 'config\\config.json') $json
  OutAdd "config.json"

  $data1 = "Sample data A"
  Set-Content (Join-Path $root 'data\\data1.txt') $data1
  OutAdd "data1.txt"

  $data2 = "Sample data B"
  Set-Content (Join-Path $root 'data\\data2.txt') $data2
  OutAdd "data2.txt"

  $html = "<html><body><h1>$name</h1></body></html>"
  Set-Content (Join-Path $root 'docs\\index.html') $html
  OutAdd "index.html"

  $css = "body{font-family:Arial;}"
  Set-Content (Join-Path $root 'docs\\style.css') $css
  OutAdd "style.css"

  $js = "alert('Hello from $name')"
  Set-Content (Join-Path $root 'docs\\app.js') $js
  OutAdd "app.js"

  $i = 1
  while($i -le ($count - 20)){
   $extra = "Extra file $i"
   Set-Content (Join-Path $root "data\\extra$i.txt") $extra
   OutAdd "extra$i.txt"
   $i++
  }

  $progress.Value = 100
  [System.Windows.Forms.MessageBox]::Show("Done creating $count files")
 }
 catch{
  [System.Windows.Forms.MessageBox]::Show($_)
 }
})

$bOpen.Add_Click({
 $root = Join-Path $t2.Text $t1.Text
 if(Test-Path $root){ Start-Process explorer.exe $root }
})

[void]$form.ShowDialog()
