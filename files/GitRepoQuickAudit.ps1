if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'git not found in PATH' }
Write-Host "Branch: $(git branch --show-current)"
Write-Host "Last 5 commits:"
git log --oneline -5
Write-Host "
Changed files:"
git status --short
