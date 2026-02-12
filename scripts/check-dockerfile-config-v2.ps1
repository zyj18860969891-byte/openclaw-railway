# Simple Dockerfile configuration check script v2
# Checks all Dockerfiles for required configurations

Write-Host "=== Checking Dockerfile Configurations ===" -ForegroundColor Cyan
Write-Host ""

# Files to check
$dockerfiles = @(
    "Dockerfile",
    "Dockerfile.railway",
    "instances/cloudclawd2/Dockerfile.railway"
)

# Check each file
$allGood = $true

foreach ($dockerfile in $dockerfiles) {
    if (-not (Test-Path $dockerfile)) {
        Write-Host "❌ File not found: $dockerfile" -ForegroundColor Red
        $allGood = $false
        continue
    }
    
    Write-Host "Checking: $dockerfile" -ForegroundColor Yellow
    
    $content = Get-Content $dockerfile -Raw
    
    # Check for Python dependencies
    $hasPython = $content -match "python3"
    $hasPip = $content -match "python3-pip"
    $hasPillow = $content -match "Pillow"
    $hasMarkdown = $content -match "markdown"
    $hasPyyaml = $content -match "pyyaml"
    $hasPlaywright = $content -match "playwright"
    $hasBreakSystem = $content -match "--break-system-packages"
    $hasCMD = $content -match 'CMD \["bash", "-c"'
    $hasPort = $content -match '\$\{PORT:-8080\}'
    
    if ($hasPython) { Write-Host "  ✅ python3" -ForegroundColor Green } else { Write-Host "  ❌ python3" -ForegroundColor Red; $allGood = $false }
    if ($hasPip) { Write-Host "  ✅ python3-pip" -ForegroundColor Green } else { Write-Host "  ❌ python3-pip" -ForegroundColor Red; $allGood = $false }
    if ($hasPillow) { Write-Host "  ✅ Pillow" -ForegroundColor Green } else { Write-Host "  ❌ Pillow" -ForegroundColor Red; $allGood = $false }
    if ($hasMarkdown) { Write-Host "  ✅ markdown" -ForegroundColor Green } else { Write-Host "  ❌ markdown" -ForegroundColor Red; $allGood = $false }
    if ($hasPyyaml) { Write-Host "  ✅ pyyaml" -ForegroundColor Green } else { Write-Host "  ❌ pyyaml" -ForegroundColor Red; $allGood = $false }
    if ($hasPlaywright) { Write-Host "  ✅ playwright" -ForegroundColor Green } else { Write-Host "  ❌ playwright" -ForegroundColor Red; $allGood = $false }
    if ($hasBreakSystem) { Write-Host "  ✅ --break-system-packages" -ForegroundColor Green } else { Write-Host "  ❌ --break-system-packages" -ForegroundColor Red; $allGood = $false }
    if ($hasCMD) { Write-Host "  ✅ CMD JSON format" -ForegroundColor Green } else { Write-Host "  ❌ CMD JSON format" -ForegroundColor Red; $allGood = $false }
    if ($hasPort) { Write-Host "  ✅ PORT environment variable" -ForegroundColor Green } else { Write-Host "  ❌ PORT environment variable" -ForegroundColor Red; $allGood = $false }
    
    Write-Host ""
}

# Check template file
Write-Host "Checking template file..." -ForegroundColor Yellow
if (Test-Path "templates/railway.template.toml") {
    $templateContent = Get-Content "templates/railway.template.toml" -Raw
    if ($templateContent -match 'dockerfilePath = "Dockerfile.railway"') {
        Write-Host "✅ Template points to correct Dockerfile" -ForegroundColor Green
    } else {
        Write-Host "❌ Template does not point to correct Dockerfile" -ForegroundColor Red
        $allGood = $false
    }
}

# Summary
Write-Host ""
Write-Host "=== Results ===" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ All Dockerfile configurations are correct" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuration validation passed:" -ForegroundColor Green
    Write-Host "1. ✅ Python dependencies installed" -ForegroundColor Green
    Write-Host "2. ✅ CMD uses JSON format" -ForegroundColor Green
    Write-Host "3. ✅ Template points to correct Dockerfile" -ForegroundColor Green
    Write-Host "4. ✅ PORT environment variable configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "For future instance creation:" -ForegroundColor Yellow
    Write-Host "1. Use templates/railway.template.toml as template" -ForegroundColor Yellow
    Write-Host "2. Template automatically uses root Dockerfile.railway" -ForegroundColor Yellow
    Write-Host "3. Dockerfile.railway contains all necessary configurations" -ForegroundColor Yellow
    Write-Host "4. New instances will have Python dependencies and JSON CMD format" -ForegroundColor Yellow
} else {
    Write-Host "❌ Issues found" -ForegroundColor Red
    exit 1
}