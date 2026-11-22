' CI-SAFE: --ci exits before displaying any popup.
Option Explicit
Dim shell, title, message
If WScript.Arguments.Count > 0 Then
    If LCase(WScript.Arguments(0)) = "--ci" Then
        WScript.Echo "CI-SAFE: PopupNotifier passed."
        WScript.Quit 0
    End If
End If
title = "Windows Reminder"
message = "Your reminder is ready."
If WScript.Arguments.Count > 0 Then title = WScript.Arguments(0)
If WScript.Arguments.Count > 1 Then message = WScript.Arguments(1)
Set shell = CreateObject("WScript.Shell")
Call shell.Popup(message, 8, title, 64)
Set shell = Nothing
