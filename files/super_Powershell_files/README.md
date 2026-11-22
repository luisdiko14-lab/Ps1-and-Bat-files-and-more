# Super PowerShell Files

A curated collection of 15 Windows utilities: 11 PowerShell scripts, 2 batch tools, and 2 VBScript helpers.

## PowerShell tools

| File | Purpose |
| --- | --- |
| SystemDashboard.ps1 | Windows, CPU, memory, uptime, and PowerShell summary |
| DiskSpaceAnalyzer.ps1 | Find the largest files under a folder |
| FolderBackupPro.ps1 | Create a ZIP backup with overwrite protection |
| SafeTempCleaner.ps1 | Preview old temporary files; deletion requires -Apply |
| NetworkHealthCheck.ps1 | Check DNS resolution and HTTPS connectivity |
| FileIntegrityScanner.ps1 | Generate SHA-256 hashes and an optional CSV manifest |
| StartupAppsAudit.ps1 | Review common Windows Run-key startup entries |
| ProcessResourceMonitor.ps1 | Show processes using the most memory |
| EventLogDigest.ps1 | Summarize recent System or Application events |
| EnvironmentDoctor.ps1 | Check common developer tools and PATH availability |
| PortAvailabilityCheck.ps1 | Check selected TCP ports on a host |

## Batch and VBScript tools

- QuickSystemReport.bat: display a concise Windows and network report.
- ProjectStarter.bat: create a src, tests, and docs project scaffold.
- PopupNotifier.vbs: display a timed Windows notification dialog.
- CountdownTimer.vbs: run a countdown and show a completion popup.

## Usage

Open PowerShell in this folder and run a script, for example:

    .\SystemDashboard.ps1
    .\DiskSpaceAnalyzer.ps1 -Path "$HOME\Downloads" -Top 15
    .\FolderBackupPro.ps1 -Source "$HOME\Documents" -Destination "$HOME\Documents-backup.zip"
    .\SafeTempCleaner.ps1
    .\SafeTempCleaner.ps1 -Apply
    .\FileIntegrityScanner.ps1 -Path "$HOME\Documents" -OutputCsv ".\manifest.csv"

The temporary-file cleaner is preview-only by default. Review its list before using -Apply.

## CI behavior

Every script in this folder has a CI-SAFE marker and a non-destructive test mode. The repository workflow syntax-checks all PowerShell files and smoke-tests only explicitly marked CI-safe scripts. Legacy scripts are not automatically launched because they may perform real system operations.
