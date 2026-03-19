Get-ChildItem -Path Cert:\LocalMachine\My -ErrorAction SilentlyContinue | Select-Object -First 15 Subject,NotAfter,Thumbprint | Format-Table -AutoSize
