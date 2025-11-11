# Cloudflare Workers Deployment Script (PowerShell)
# Run this script from PowerShell on Windows

Write-Host "🚀 Public Domain Hunter - Cloudflare Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if npx is available
try {
    $null = Get-Command npx -ErrorAction Stop
    Write-Host "✅ Node.js and npm are installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: npx is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if API token is set
if (-not $env:CLOUDFLARE_API_TOKEN) {
    Write-Host "⚠️  CLOUDFLARE_API_TOKEN environment variable not set" -ForegroundColor Yellow
    Write-Host ""
    $token = Read-Host "Enter your Cloudflare API Token"
    $env:CLOUDFLARE_API_TOKEN = $token
}

Write-Host ""

# Step 1: Create D1 Database
Write-Host "📊 Step 1: Creating D1 Database" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
Write-Host "Running: npx wrangler d1 create publicdomainhunter_db" -ForegroundColor Gray
Write-Host ""

$dbOutput = npx wrangler d1 create publicdomainhunter_db 2>&1 | Out-String
Write-Host $dbOutput

# Extract database_id from output
if ($dbOutput -match 'database_id = "([^"]+)"') {
    $databaseId = $matches[1]
    Write-Host "✅ Database ID extracted: $databaseId" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Could not extract database_id automatically" -ForegroundColor Yellow
    Write-Host "Please check if the database already exists or if there was an error" -ForegroundColor Yellow
    Write-Host ""
    $databaseId = Read-Host "Enter the database_id manually (or press Enter to skip)"

    if ([string]::IsNullOrWhiteSpace($databaseId)) {
        Write-Host "⏩ Skipping database creation - will use existing configuration" -ForegroundColor Yellow
    }
}

# Step 2: Update wrangler.toml
if (-not [string]::IsNullOrWhiteSpace($databaseId)) {
    Write-Host ""
    Write-Host "📝 Step 2: Updating wrangler.toml with database_id" -ForegroundColor Cyan
    Write-Host "---------------------------------------------------" -ForegroundColor Cyan

    $wranglerPath = "wrangler.toml"
    $content = Get-Content $wranglerPath -Raw

    if ($content -match '\[\[d1_databases\]\]') {
        Write-Host "✅ d1_databases section found in wrangler.toml" -ForegroundColor Green

        # Replace PLACEHOLDER_DB_ID with actual database_id
        $content = $content -replace 'database_id = "PLACEHOLDER_DB_ID"', "database_id = `"$databaseId`""
        $content = $content -replace 'database_id = "[^"]+"', "database_id = `"$databaseId`""

        Set-Content $wranglerPath -Value $content
        Write-Host "✅ Updated wrangler.toml with database_id: $databaseId" -ForegroundColor Green
    } else {
        Write-Host "➕ Adding d1_databases section to wrangler.toml" -ForegroundColor Yellow
        Add-Content $wranglerPath "`n# D1 Database`n[[d1_databases]]`nbinding = `"DB`"`ndatabase_name = `"publicdomainhunter_db`"`ndatabase_id = `"$databaseId`""
        Write-Host "✅ Added d1_databases section to wrangler.toml" -ForegroundColor Green
    }
} else {
    Write-Host "⏩ Step 2: Skipped (database already configured)" -ForegroundColor Yellow
}

# Step 3: Initialize Database Schema
Write-Host ""
Write-Host "🗄️  Step 3: Creating Database Tables" -ForegroundColor Cyan
Write-Host "------------------------------------" -ForegroundColor Cyan

if (Test-Path "schema.sql") {
    Write-Host "Running: npx wrangler d1 execute publicdomainhunter_db --file=./schema.sql" -ForegroundColor Gray
    npx wrangler d1 execute publicdomainhunter_db --file=./schema.sql
    Write-Host "✅ Database schema created successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  schema.sql not found - skipping schema creation" -ForegroundColor Yellow
    Write-Host "You'll need to create the database tables manually" -ForegroundColor Yellow
}

# Step 4: Build Frontend
Write-Host ""
Write-Host "🎨 Step 4: Building Frontend" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Cyan
Write-Host "Running: npm install && npm run cf:build" -ForegroundColor Gray

Push-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    npm run cf:build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend built successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} else {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Step 5: Deploy to Cloudflare
Write-Host ""
Write-Host "☁️  Step 5: Deploying to Cloudflare Workers" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "Running: npx wrangler deploy" -ForegroundColor Gray

npx wrangler deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "=======================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application should now be live at:" -ForegroundColor Cyan
    Write-Host "https://publicdomainhunter.averymiddlebrook2014.workers.dev/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test the homepage: https://publicdomainhunter.averymiddlebrook2014.workers.dev/" -ForegroundColor White
    Write-Host "2. Check health: https://publicdomainhunter.averymiddlebrook2014.workers.dev/auth/health" -ForegroundColor White
    Write-Host "3. Test registration: https://publicdomainhunter.averymiddlebrook2014.workers.dev/register" -ForegroundColor White
    Write-Host ""
    Write-Host "⚙️  Post-Deployment Configuration:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "If using a separate backend, set BACKEND_URL:" -ForegroundColor White
    Write-Host "  1. Go to Cloudflare Dashboard → Workers & Pages → publicdomainhunter" -ForegroundColor Gray
    Write-Host "  2. Settings → Variables → Add variable" -ForegroundColor Gray
    Write-Host "  3. Name: BACKEND_URL, Value: https://your-backend-url.com" -ForegroundColor Gray
    Write-Host ""
    Write-Host "If using OAuth (Google/GitHub login), configure in Dashboard:" -ForegroundColor White
    Write-Host "  - GOOGLE_CLIENT_ID" -ForegroundColor Gray
    Write-Host "  - GOOGLE_CLIENT_SECRET (encrypted)" -ForegroundColor Gray
    Write-Host "  - GITHUB_CLIENT_ID" -ForegroundColor Gray
    Write-Host "  - GITHUB_CLIENT_SECRET (encrypted)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Done! 🚀" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}
