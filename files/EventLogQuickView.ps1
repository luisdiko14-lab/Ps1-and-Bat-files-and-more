param([int]$Newest = 20)
Get-EventLog -LogName System -Newest $Newest |
    Select-Object TimeGenerated, EntryType, Source, EventID, Message |
    Format-Table -Wrap
