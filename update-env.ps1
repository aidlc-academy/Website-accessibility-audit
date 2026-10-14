# PowerShell script to safely update .env file with Supabase credentials
# This script prompts for your service role key securely

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       AccessLens Supabase Configuration Helper            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Your Supabase URL is already configured:" -ForegroundColor Green
Write-Host "  https://uzvxjmzjkprojavrzygi.supabase.co" -ForegroundColor Yellow
Write-Host ""

Write-Host "Now you need to add your SERVICE ROLE key" -ForegroundColor Green
Write-Host ""
Write-Host "How to get it:" -ForegroundColor White
Write-Host "  1. Go to: https://app.supabase.com" -ForegroundColor Gray
Write-Host "  2. Click: Project Settings (gear icon)" -ForegroundColor Gray
Write-Host "  3. Click: API" -ForegroundColor Gray
Write-Host "  4. Find: 'service_role' key (NOT 'anon' key!)" -ForegroundColor Gray
Write-Host "  5. Click the EYE icon to reveal it" -ForegroundColor Gray
Write-Host "  6. Click the COPY icon to copy it" -ForegroundColor Gray
Write-Host ""

# Prompt for service role key (securely)
$serviceRoleKey = Read-Host "Paste your service_role key here (it won't be visible)"

# Validate the key format
if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    Write-Host ""
    Write-Host "❌ Error: No key provided" -ForegroundColor Red
    Write-Host "   Please run the script again and paste your service role key" -ForegroundColor Red
    exit 1
}

if ($serviceRoleKey -eq "REPLACE_THIS_WITH_YOUR_SERVICE_ROLE_KEY") {
    Write-Host ""
    Write-Host "❌ Error: You pasted the placeholder text" -ForegroundColor Red
    Write-Host "   You need to paste your ACTUAL service role key from Supabase" -ForegroundColor Red
    exit 1
}

if (-not $serviceRoleKey.StartsWith("eyJ")) {
    Write-Host ""
    Write-Host "⚠️  Warning: Your key doesn't start with 'eyJ'" -ForegroundColor Yellow
    Write-Host "   Make sure you copied the 'service_role' key (not 'anon' key)" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Gray
        exit 0
    }
}

if ($serviceRoleKey.Length -lt 100) {
    Write-Host ""
    Write-Host "⚠️  Warning: Your key seems too short ($($serviceRoleKey.Length) characters)" -ForegroundColor Yellow
    Write-Host "   Service role keys are typically 200+ characters long" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Gray
        exit 0
    }
}

# Update .env file
$envPath = ".\.env"
$envContent = @"
PORT=5173
HOST=127.0.0.1
SCAN_TIMEOUT_MS=60000
PUPPETEER_EXECUTABLE_PATH=

# Storage Configuration
STORAGE_MODE=json

# Supabase Configuration (Backend Only - Never expose to browser!)
SUPABASE_URL=https://uzvxjmzjkprojavrzygi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey
"@

try {
    Set-Content -Path $envPath -Value $envContent -NoNewline
    Write-Host ""
    Write-Host "✅ Success! Your .env file has been updated" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Verify configuration:" -ForegroundColor White
    Write-Host "     node migrations/verify-setup.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Import your data:" -ForegroundColor White
    Write-Host "     node migrations/migrate-to-supabase.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Switch to Supabase mode:" -ForegroundColor White
    Write-Host "     Edit .env and change: STORAGE_MODE=supabase" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Error: Could not update .env file" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
