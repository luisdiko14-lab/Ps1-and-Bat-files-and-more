$quotes = @(
    'Keep going. You are closer than you think.',
    'A small step still moves you forward.',
    'Your ideas are worth sharing.'
)
$quote = $quotes[(Get-Random -Minimum 0 -Maximum $quotes.Count)]
Write-Host $quote -ForegroundColor Cyan
