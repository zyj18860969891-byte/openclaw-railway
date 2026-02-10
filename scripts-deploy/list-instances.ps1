# OpenClaw 实例列表脚本 - PowerShell 版本
# 用法: .\list-instances.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== OpenClaw 实例列表 ===" -ForegroundColor Cyan
Write-Host ""

$instancesDir = "instances"

if (-not (Test-Path $instancesDir)) {
    Write-Host "暂无实例" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "创建新实例: .\scripts-deploy\create-instance.ps1 -Username <用户名> -ChannelType <通道类型>"
    exit 0
}

$instances = Get-ChildItem -Path $instancesDir -Directory

if ($instances.Count -eq 0) {
    Write-Host "暂无实例" -ForegroundColor Yellow
    exit 0
}

$totalInstances = 0
$runningInstances = 0

foreach ($instance in $instances) {
    $totalInstances++
    $instanceName = $instance.Name
    $envFile = Join-Path $instance.FullName ".env"
    
    Write-Host "📦 $instanceName" -ForegroundColor White
    
    if (Test-Path $envFile) {
        # 读取配置信息
        $envContent = Get-Content $envFile
        
        # 获取用户名
        $username = ($envContent | Select-String "USERNAME=(.+)").Matches.Groups[1].Value
        if (-not $username) { $username = "未知" }
        
        # 获取通道类型
        $channelType = "未知"
        if ($envContent | Select-String "FEISHU_ENABLED=true") { $channelType = "飞书" }
        elseif ($envContent | Select-String "DINGTALK_ENABLED=true") { $channelType = "钉钉" }
        elseif ($envContent | Select-String "WECOM_ENABLED=true") { $channelType = "企业微信" }
        
        # 获取创建时间
        $createTime = ($envContent | Select-String "创建时间: (.+)").Matches.Groups[1].Value
        if (-not $createTime) { $createTime = "未知" }
        
        Write-Host "   用户: $username" -ForegroundColor Gray
        Write-Host "   通道: $channelType" -ForegroundColor Gray
        Write-Host "   创建: $createTime" -ForegroundColor Gray
        
        # 检查 Railway 状态
        Push-Location $instance.FullName
        try {
            $status = railway status 2>&1
            if ($status -match "running" -or $status -match "SUCCESS") {
                Write-Host "   状态: ✅ 运行中" -ForegroundColor Green
                $runningInstances++
            } elseif ($status -match "stopped" -or $status -match "FAILED") {
                Write-Host "   状态: ⏹️ 已停止" -ForegroundColor Yellow
            } else {
                Write-Host "   状态: ❓ 未知" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   状态: 📁 未部署" -ForegroundColor DarkGray
        }
        Pop-Location
    }
    
    Write-Host ""
}

Write-Host "=== 统计 ===" -ForegroundColor Cyan
Write-Host "总实例数: $totalInstances"
Write-Host "运行中: $runningInstances"
Write-Host "已停止: $($totalInstances - $runningInstances)"
Write-Host ""
Write-Host "📋 操作命令:" -ForegroundColor Yellow
Write-Host "  创建实例: .\scripts-deploy\create-instance.ps1 -Username <用户名> -ChannelType <通道类型>"
Write-Host "  部署实例: .\scripts-deploy\deploy-instance.ps1 -InstanceName <实例名称>"
Write-Host "  删除实例: Remove-Item -Recurse -Force instances\<实例名称>"
