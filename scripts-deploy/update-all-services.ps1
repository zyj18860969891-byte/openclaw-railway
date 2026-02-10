# OpenClaw 批量更新所有服务脚本
# 用法: .\update-all-services.ps1 [-Rolling]

param(
    [switch]$Rolling  # 是否滚动更新（逐个更新）
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenClaw 批量更新服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Railway CLI
try {
    $version = railway --version 2>&1
    Write-Host "✅ Railway CLI: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ 请先安装 Railway CLI" -ForegroundColor Red
    exit 1
}

# 获取所有服务
Write-Host ""
Write-Host "获取服务列表..." -ForegroundColor Yellow

# 已知的服务列表（可以手动维护）
$services = @(
    "openclaw-railway",
    "cloudclawd2"
)

# 尝试从 Railway 获取服务列表
try {
    $statusOutput = railway status 2>&1
    Write-Host "当前项目状态:" -ForegroundColor Gray
    Write-Host $statusOutput
} catch {
    Write-Host "⚠️ 无法获取服务列表，使用预设列表" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "待更新服务:" -ForegroundColor Yellow
foreach ($svc in $services) {
    Write-Host "  - $svc" -ForegroundColor White
}

Write-Host ""
if ($Rolling) {
    Write-Host "模式: 滚动更新（逐个更新，等待完成后再更新下一个）" -ForegroundColor Yellow
} else {
    Write-Host "模式: 批量更新（同时更新所有服务）" -ForegroundColor Yellow
}

Write-Host ""
$confirm = Read-Host "确认更新? (y/n)"
if ($confirm -ne "y") {
    Write-Host "已取消" -ForegroundColor Yellow
    exit 0
}

# 更新服务
$successCount = 0
$failCount = 0

foreach ($service in $services) {
    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "更新服务: $service" -ForegroundColor Cyan
    
    try {
        $result = railway redeploy -s $service -y 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $service 更新成功" -ForegroundColor Green
            $successCount++
            
            if ($Rolling) {
                Write-Host "等待 30 秒后继续..." -ForegroundColor Yellow
                Start-Sleep -Seconds 30
            }
        } else {
            Write-Host "❌ $service 更新失败: $result" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "❌ $service 更新异常: $_" -ForegroundColor Red
        $failCount++
    }
}

# 总结
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  更新完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "成功: $successCount" -ForegroundColor Green
Write-Host "失败: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -gt 0) {
    Write-Host "⚠️ 部分服务更新失败，请检查日志" -ForegroundColor Yellow
    Write-Host "查看日志: railway logs -s <服务名>" -ForegroundColor White
}
