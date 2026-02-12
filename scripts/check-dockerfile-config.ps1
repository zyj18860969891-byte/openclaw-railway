# 检查所有 Dockerfile 的配置正确性
# 用于确保新实例部署时不会出现配置问题

Write-Host "=== 检查所有 Dockerfile 配置 ===" -ForegroundColor Cyan
Write-Host ""

# 检查的文件列表
$dockerfiles = @(
    "Dockerfile",
    "Dockerfile.railway",
    "instances/cloudclawd2/Dockerfile.railway"
)

# 检查的关键配置
$checks = @(
    "python3",
    "python3-pip",
    "Pillow",
    "markdown",
    "pyyaml",
    "playwright",
    "playwright install chromium",
    "--break-system-packages",
    'CMD \["bash", "-c"',
    '${PORT:-8080}'
)

$missingFiles = @()
$missingConfigs = @()

foreach ($dockerfile in $dockerfiles) {
    if (-not (Test-Path $dockerfile)) {
        Write-Host "❌ 文件不存在: $dockerfile" -ForegroundColor Red
        $missingFiles += $dockerfile
        continue
    }
    
    Write-Host "检查: $dockerfile" -ForegroundColor Yellow
    
    foreach ($check in $checks) {
        $content = Get-Content $dockerfile -Raw
        if ($content -match [regex]::Escape($check)) {
            Write-Host "  ✅ 找到: $check" -ForegroundColor Green
        } else {
            Write-Host "  ❌ 缺少: $check" -ForegroundColor Red
            $missingConfigs += "$dockerfile - $check"
        }
    }
    Write-Host ""
}

# 检查模板文件
Write-Host "检查模板文件..." -ForegroundColor Yellow
if (Test-Path "templates/railway.template.toml") {
    $templateContent = Get-Content "templates/railway.template.toml" -Raw
    if ($templateContent -match 'dockerfilePath = "Dockerfile.railway"') {
        Write-Host "✅ 模板文件指向正确的 Dockerfile" -ForegroundColor Green
    } else {
        Write-Host "❌ 模板文件未指向正确的 Dockerfile" -ForegroundColor Red
        $missingConfigs += "templates/railway.template.toml - dockerfilePath"
    }
}

# 检查 CMD 格式
Write-Host "检查 CMD 格式..." -ForegroundColor Yellow
foreach ($dockerfile in $dockerfiles) {
    if (Test-Path $dockerfile) {
        $content = Get-Content $dockerfile -Raw
        if ($content -match 'CMD \["bash", "-c"') {
            Write-Host "✅ $dockerfile 使用 JSON 格式 CMD" -ForegroundColor Green
        } else {
            Write-Host "❌ $dockerfile 未使用 JSON 格式 CMD" -ForegroundColor Red
            $missingConfigs += "$dockerfile - CMD JSON format"
        }
    }
}

# 汇总结果
Write-Host ""
Write-Host "=== 检查结果 ===" -ForegroundColor Cyan
if ($missingFiles.Count -eq 0 -and $missingConfigs.Count -eq 0) {
    Write-Host "✅ 所有 Dockerfile 配置都正确" -ForegroundColor Green
    Write-Host ""
    Write-Host "配置验证通过：" -ForegroundColor Green
    Write-Host "1. ✅ Python 依赖已安装" -ForegroundColor Green
    Write-Host "2. ✅ CMD 使用 JSON 格式" -ForegroundColor Green
    Write-Host "3. ✅ 模板文件指向正确的 Dockerfile" -ForegroundColor Green
    Write-Host "4. ✅ 环境变量 PORT 已配置" -ForegroundColor Green
    Write-Host ""
    Write-Host "未来创建新实例时：" -ForegroundColor Yellow
    Write-Host "1. 使用 templates/railway.template.toml 作为配置模板" -ForegroundColor Yellow
    Write-Host "2. 模板会自动使用根目录的 Dockerfile.railway" -ForegroundColor Yellow
    Write-Host "3. Dockerfile.railway 包含所有必要的配置" -ForegroundColor Yellow
    Write-Host "4. 新实例将自动包含 Python 依赖和正确的 CMD 格式" -ForegroundColor Yellow
} else {
    Write-Host "❌ 发现问题:" -ForegroundColor Red
    if ($missingFiles.Count -gt 0) {
        Write-Host "缺失文件:" -ForegroundColor Red
        foreach ($file in $missingFiles) {
            Write-Host "  - $file" -ForegroundColor Red
        }
    }
    if ($missingConfigs.Count -gt 0) {
        Write-Host "缺失配置:" -ForegroundColor Red
        foreach ($config in $missingConfigs) {
            Write-Host "  - $config" -ForegroundColor Red
        }
    }
    exit 1
}