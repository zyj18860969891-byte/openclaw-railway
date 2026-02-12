# Simple Dockerfile configuration check script
# Checks all Dockerfiles for required configurations

Write-Host "=== Checking Dockerfile Configurations ===" -ForegroundColor Cyan
Write-Host ""

# Files to check
$dockerfiles = @(
    "Dockerfile",
    "Dockerfile.railway",
    "instances/cloudclawd2/Dockerfile.railway"
)

# Required configurations
$checks = @(
    "python3",
    "python3-pip",
    "Pillow",
    "markdown",
    "pyyaml",
    "playwright",
    "playwright install chromium",
    "--break-system-packages",
    'CMD \["bash", "-c"\]',
    '${PORT:-8080}'
)

$missingFiles = @()
$missingConfigs = @()

foreach ($dockerfile in $dockerfiles) {
    if (-not (Test-Path $dockerfile)) {
        Write-Host "❌ File not found: $dockerfile" -ForegroundColor Red
        $missingFiles += $dockerfile
        continue
    }
    
    Write-Host "Checking: $dockerfile" -ForegroundColor Yellow
    
    foreach ($check in $checks) {
        $content = Get-Content $dockerfile -Raw
        if ($content -match [regex]::Escape($check)) {
            Write-Host "  ✅ Found: $check" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Missing: $check" -ForegroundColor Red
            $missingConfigs += "$dockerfile - $check"
        }
    }
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
        $missingConfigs += "templates/railway.template.toml - dockerfilePath"
    }
}

# Check CMD format
Write-Host "Checking CMD format..." -ForegroundColor Yellow
foreach ($dockerfile in $dockerfiles) {
    if (Test-Path $dockerfile) {
        $content = Get-Content $dockerfile -Raw
        if ($content -match 'CMD \["bash", "-c"') {
            Write-Host "✅ $dockerfile uses JSON CMD format" -ForegroundColor Green
        } else {
            Write-Host "❌ $dockerfile does not use JSON CMD format" -ForegroundColor Red
            $missingConfigs += "$dockerfile - CMD JSON format"
        }
    }
}

# Summary
Write-Host ""
Write-Host "=== Results ===" -ForegroundColor Cyan
if ($missingFiles.Count -eq 0 -and $missingConfigs.Count -eq 0) {
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
    Write-Host "❌ Issues found:" -ForegroundColor Red
    if ($missingFiles.Count -gt 0) {
        Write-Host "Missing files:" -ForegroundColor Red
        foreach ($file in $missingFiles) {
            Write-Host "  - $file" -ForegroundColor Red
        }
    }
    if ($missingConfigs.Count -gt 0) {
        Write-Host "Missing configurations:" -ForegroundColor Red
        foreach ($config in $missingConfigs) {
            Write-Host "  - $config" -ForegroundColor Red
        }
    }
    exit 1
}