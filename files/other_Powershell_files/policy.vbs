' policy_toggle.vbs
' Toggle some Windows policies (HKCU) - Control Panel, RegEdit, CMD, Task Manager
' Exports backups before changing values.
Option Explicit

Dim sh, choice, ok
Set sh = CreateObject("WScript.Shell")

' Registry helper: write REG_DWORD under HKCU
Sub RegWriteDword(path, name, value)
  On Error Resume Next
  sh.RegWrite "HKCU\" & path & "\" & name, CLng(value), "REG_DWORD"
  If Err.Number <> 0 Then
    WScript.Echo "Error writing registry: " & Err.Number & " - " & Err.Description
    Err.Clear
  End If
  On Error GoTo 0
End Sub

' Registry helper: delete value (set to 0 by writing 0 is fine for revert)
Sub RegDeleteValue(path, name)
  On Error Resume Next
  sh.RegDelete "HKCU\" & path & "\" & name
  Err.Clear
  On Error GoTo 0
End Sub

' Export a registry subtree to a .reg file (uses reg.exe)
Function ExportKey(hiveAndPath, outFile)
  Dim cmd, exec, exitCode
  cmd = "cmd /c reg export " & Chr(34) & hiveAndPath & Chr(34) & " " & Chr(34) & outFile & Chr(34) & " /y"
  exitCode = sh.Run(cmd, 0, True)
  ExportKey = (exitCode = 0)
End Function

' Paths and names we will use (HKCU)
Const pathExplorer = "Software\Microsoft\Windows\CurrentVersion\Policies\Explorer"
Const pathSystem   = "Software\Microsoft\Windows\CurrentVersion\Policies\System"

' Make sure keys exist by writing then possibly deleting dummy (RegWrite will create keys)
RegWriteDword pathExplorer, "NoControlPanel", 0
RegWriteDword pathSystem, "DisableRegistryTools", 0
RegWriteDword pathSystem, "DisableCMD", 0
RegWriteDword pathSystem, "DisableTaskMgr", 0

' Ask user what to do
choice = LCase(Trim(InputBox("Choose an action (type the number):" & vbCrLf & _
  "1 - Disable: Control Panel, Registry Editor, CMD, Task Manager" & vbCrLf & _
  "2 - Enable (undo): those policies (sets values to 0 / deletes where applicable)" & vbCrLf & _
  "3 - Revert using a .reg backup file (will ask for file path)" & vbCrLf & _
  "4 - Export current policy keys for backup" & vbCrLf & _
  "5 - Show current values" & vbCrLf & vbCrLf & "Type 1,2,3,4 or 5", "Policy Toggle")))

If choice = "" Then WScript.Quit

Select Case choice
  Case "1"
    ok = ExportKey("HKCU\" & pathExplorer, CreateBackupName("Explorer"))
    ok = ExportKey("HKCU\" & pathSystem, CreateBackupName("System")) Or ok
    DisableAll
    MsgBox "Policies applied (disabled). Backups exported to your user folder (if possible).", vbInformation, "Done"
  Case "2"
    EnableAll
    MsgBox "Policies reverted (enabled).", vbInformation, "Done"
  Case "3"
    Dim regPath
    regPath = InputBox("Enter full path to .reg backup file to import (e.g. C:\Users\You\backup-System.reg):", "Import .reg")
    If regPath <> "" Then
      ImportRegFile regPath
    End If
  Case "4"
    ok = ExportKey("HKCU\" & pathExplorer, CreateBackupName("Explorer"))
    ok = ExportKey("HKCU\" & pathSystem, CreateBackupName("System")) Or ok
    If ok Then
      MsgBox "Export finished. Look for the .reg files in your user folder (or script folder).", vbInformation, "Export"
    Else
      MsgBox "Export may have failed (reg.exe not available or permission issue).", vbExclamation, "Export"
    End If
  Case "5"
    ShowCurrentValues
  Case Else
    MsgBox "Unknown choice.", vbExclamation, "Cancelled"
End Select

WScript.Quit

' -------------------------
Sub DisableAll()
  ' 1 disables: Control Panel, Registry editor, CMD, Task Manager
  RegWriteDword pathExplorer, "NoControlPanel", 1
  RegWriteDword pathSystem, "DisableRegistryTools", 1
  ' DisableCMD: 1 = disable cmd.exe but allow running batch files? (Group policy semantics vary)
  RegWriteDword pathSystem, "DisableCMD", 1
  RegWriteDword pathSystem, "DisableTaskMgr", 1
End Sub

Sub EnableAll()
  ' Re-enable by setting 0 or deleting
  RegWriteDword pathExplorer, "NoControlPanel", 0
  RegWriteDword pathSystem, "DisableRegistryTools", 0
  RegWriteDword pathSystem, "DisableCMD", 0
  RegWriteDword pathSystem, "DisableTaskMgr", 0
End Sub

Sub ShowCurrentValues()
  Dim val
  On Error Resume Next
  val = sh.RegRead("HKCU\" & pathExplorer & "\NoControlPanel")
  MsgBox "NoControlPanel = " & CStr(val), vbInformation, "Explorer"
  val = sh.RegRead("HKCU\" & pathSystem & "\DisableRegistryTools")
  MsgBox "DisableRegistryTools = " & CStr(val), vbInformation, "System"
  val = sh.RegRead("HKCU\" & pathSystem & "\DisableCMD")
  MsgBox "DisableCMD = " & CStr(val), vbInformation, "System"
  val = sh.RegRead("HKCU\" & pathSystem & "\DisableTaskMgr")
  MsgBox "DisableTaskMgr = " & CStr(val), vbInformation, "System"
  On Error GoTo 0
End Sub

Sub ImportRegFile(filePath)
  Dim cmd, rc
  If Not FileExists(filePath) Then
    MsgBox "File not found: " & filePath, vbExclamation, "Import"
    Exit Sub
  End If
  cmd = "cmd /c reg import " & Chr(34) & filePath & Chr(34)
  rc = sh.Run(cmd, 1, True)
  If rc = 0 Then
    MsgBox "Import succeeded.", vbInformation, "Import"
  Else
    MsgBox "Import returned code: " & rc & ". Try running as admin.", vbExclamation, "Import"
  End If
End Sub

Function CreateBackupName(prefix)
  Dim fso, userFolder, name
  Set fso = CreateObject("Scripting.FileSystemObject")
  userFolder = sh.ExpandEnvironmentStrings("%USERPROFILE%")
  If userFolder = "" Then userFolder = fso.GetAbsolutePathName(".")
  name = userFolder & "\" & prefix & "-policies-backup-" & Replace(Replace(Now(), ":", "-"), " ", "_") & ".reg"
  CreateBackupName = name
End Function

Function FileExists(path)
  Dim fso
  Set fso = CreateObject("Scripting.FileSystemObject")
  FileExists = fso.FileExists(path)
End Function
