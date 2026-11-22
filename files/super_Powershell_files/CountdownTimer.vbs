' CI-SAFE: --ci exits before waiting or displaying any popup.
Option Explicit
Dim seconds, shell
If WScript.Arguments.Count > 0 Then
    If LCase(WScript.Arguments(0)) = "--ci" Then
        WScript.Echo "CI-SAFE: CountdownTimer passed."
        WScript.Quit 0
    End If
End If
seconds = 10
If WScript.Arguments.Count > 0 Then
    If IsNumeric(WScript.Arguments(0)) Then seconds = CInt(WScript.Arguments(0))
End If
If seconds < 1 Or seconds > 3600 Then
    WScript.Echo "Enter a number from 1 to 3600 seconds."
    WScript.Quit 1
End If
WScript.Echo "Timer started: " & seconds & " second(s)."
WScript.Sleep seconds * 1000
Set shell = CreateObject("WScript.Shell")
Call shell.Popup("Time is up!", 5, "Countdown Timer", 64)
Set shell = Nothing
