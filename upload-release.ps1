# 施工日志系统 - GitHub Release 自动上传脚本
# v1.0.0

$ErrorActionPreference = "Stop"

$REPO_OWNER = "useEffectGuy"
$REPO_NAME = "shigongrizhi"
$TAG = "v1.0.0"
$RELEASES_DIR = "$PSScriptRoot\releases"

$FILES = @(
    @{ Path = "$RELEASES_DIR\backend-v1.0.0.zip"; ContentType = "application/zip" },
    @{ Path = "$RELEASES_DIR\desktop-v1.0.0.zip"; ContentType = "application/zip" },
    @{ Path = "$RELEASES_DIR\mobile-app-source-v1.0.0.zip"; ContentType = "application/zip" },
    @{ Path = "$RELEASES_DIR\安装使用说明.md"; ContentType = "text/markdown" }
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  施工日志系统 - GitHub Release 上传脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "仓库: $REPO_OWNER/$REPO_NAME" -ForegroundColor White
Write-Host "版本: $TAG" -ForegroundColor White
Write-Host ""

if (-not $env:GITHUB_TOKEN) {
    Write-Host "[错误] 未检测到 GITHUB_TOKEN 环境变量" -ForegroundColor Red
    Write-Host ""
    Write-Host "请按以下步骤操作：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "步骤 1: 创建 GitHub Personal Access Token" -ForegroundColor White
    Write-Host "  1. 访问: https://github.com/settings/tokens" -ForegroundColor Gray
    Write-Host "  2. 点击 'Generate new token'" -ForegroundColor Gray
    Write-Host "  3. 勾选 'repo' 权限" -ForegroundColor Gray
    Write-Host "  4. 复制生成的 token" -ForegroundColor Gray
    Write-Host ""
    Write-Host "步骤 2: 设置环境变量" -ForegroundColor White
    Write-Host "  在 PowerShell 中执行：" -ForegroundColor Gray
    Write-Host "  `$env:GITHUB_TOKEN = '你的token'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "步骤 3: 重新运行脚本" -ForegroundColor White
    Write-Host "  .\upload-release.ps1" -ForegroundColor Gray
    exit 1
}

$TOKEN = $env:GITHUB_TOKEN
$headers = @{
    "Authorization" = "token $TOKEN"
    "Accept" = "application/vnd.github.v3+json"
}

Write-Host "[1/4] 检查文件是否存在..." -ForegroundColor Yellow
$missingFiles = @()
foreach ($file in $FILES) {
    if (-not (Test-Path $file.Path)) {
        $missingFiles += $file.Path
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "[错误] 以下文件不存在：" -ForegroundColor Red
    foreach ($f in $missingFiles) {
        Write-Host "  - $f" -ForegroundColor Red
    }
    exit 1
}
Write-Host "  所有文件检查通过" -ForegroundColor Green

Write-Host "[2/4] 获取 Release ID..." -ForegroundColor Yellow
$getReleaseUrl = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/tags/$TAG"

try {
    $response = Invoke-RestMethod -Uri $getReleaseUrl -Headers $headers -Method GET
    $releaseId = $response.id
    $uploadUrl = $response.upload_url -replace "\{\?name,label\}", ""
    Write-Host "  Release ID: $releaseId" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "[错误] 未找到 release: $TAG" -ForegroundColor Red
        Write-Host "  请先在 GitHub 创建 release 后再运行此脚本" -ForegroundColor Yellow
        Write-Host "  访问: https://github.com/$REPO_OWNER/$REPO_NAME/releases/new" -ForegroundColor Gray
    } else {
        Write-Host "[错误] 获取 Release 失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host "[3/4] 检查现有 Assets..." -ForegroundColor Yellow
$existingAssets = $response.assets | ForEach-Object { $_.name }
Write-Host "  现有 Assets: $($existingAssets.Count) 个" -ForegroundColor White

Write-Host ""
Write-Host "[4/4] 上传文件..." -ForegroundColor Yellow
Write-Host ""

$uploadHeaders = @{
    "Authorization" = "token $TOKEN"
    "Accept" = "application/vnd.github.v3+json"
}

$successCount = 0
$skipCount = 0
$failCount = 0

foreach ($file in $FILES) {
    $fileName = Split-Path $file.Path -Leaf
    $fileSize = (Get-Item $file.Path).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    
    Write-Host "  处理: $fileName ($fileSizeMB MB)" -ForegroundColor Cyan
    
    if ($existingAssets -contains $fileName) {
        Write-Host "    跳过: 文件已存在" -ForegroundColor Yellow
        $skipCount++
        continue
    }
    
    $uploadFileUrl = "$uploadUrl?name=$fileName"
    
    try {
        $fileBytes = [System.IO.File]::ReadAllBytes($file.Path)
        
        $uploadParams = @{
            Uri = $uploadFileUrl
            Headers = $uploadHeaders
            Method = "POST"
            ContentType = $file.ContentType
            InFile = $file.Path
        }
        
        Write-Host "    上传中..." -ForegroundColor Gray
        $result = Invoke-RestMethod @uploadParams
        Write-Host "    完成!" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "    失败: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  上传完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  成功: $successCount" -ForegroundColor Green
Write-Host "  跳过: $skipCount" -ForegroundColor Yellow
Write-Host "  失败: $failCount" -ForegroundColor Red
Write-Host ""
Write-Host "访问 Release 页面:" -ForegroundColor White
Write-Host "  https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$TAG" -ForegroundColor Gray
