# =========================================================================
# fast-deploy.ps1 — SeaFool
# Đóng gói + triển khai lên server qua SSH/SCP (không cần Docker Registry)
# Yêu cầu: Docker Desktop, OpenSSH client, kết nối SSH đến server
# Chạy từ thư mục gốc monorepo: .\fast-deploy.ps1
# =========================================================================

$SERVER_IP   = "14.225.217.232"
$SERVER_USER = "root"
$REMOTE_PATH = "~/deployment/haisan"
$API_URL     = "http://${SERVER_IP}:3002"   # Browser gọi qua Next.js proxy → api:3001 nội bộ

$ErrorActionPreference = "Stop"

# Xác định thư mục gốc monorepo (nơi chứa fast-deploy.ps1)
$REPO_ROOT = if ($PSScriptRoot) {
    $PSScriptRoot
} else {
    # Fallback: lấy từ argument thứ 0 nếu chạy pwsh ./script.ps1
    Split-Path -Parent (Resolve-Path $PSScriptRoot -ErrorAction SilentlyContinue 2>$null)
    if (-not $REPO_ROOT) { Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }
}
if (-not $REPO_ROOT -or $REPO_ROOT -eq '') {
    # Thử phân tích đường dẫn tuyệt đối
    $scriptPath = $MyInvocation.MyCommand.Path
    if ($scriptPath -match '^(.+[/\\])[^/\\]+$') {
        $REPO_ROOT = $matches[1].TrimEnd('/','\')
    } else {
        $REPO_ROOT = Split-Path -Parent $scriptPath
    }
}
Set-Location $REPO_ROOT
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Gray

function Invoke-Step {
    param([string]$Title, [scriptblock]$Action)
    Write-Host "`n$Title" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "Thất bại: $Title (exit code $LASTEXITCODE)" }
}

# -----------------------------------------------------------------------
# [1/5] Build Docker images từ monorepo root
# -----------------------------------------------------------------------
Write-Host "`n[1/5] Build Docker images..." -ForegroundColor Yellow

# Đảm bảo docker buildx builder tồn tại và hỗ trợ multi-platform
$builderName = "hsbx-builder"
$existingBuilder = docker buildx inspect $builderName 2>$null
if (-not $existingBuilder -or $existingBuilder -match "error|no builder") {
    Write-Host "      Tạo docker buildx builder ($builderName)..." -ForegroundColor Gray
    docker buildx create --name $builderName --driver docker-container --use 2>$null || docker buildx use default
}

# Bật QEMU nếu chưa có (cho phép build cross-platform)
$qemuInstalled = docker buildx inspect --bootstrap 2>$null
if ($qemuInstalled -match "image" -or $qemuInstalled -notmatch "running") {
    Write-Host "      Setup QEMU cho cross-platform..." -ForegroundColor Gray
    docker run --privileged --rm tonistiigi/binfmt:latest --install all 2>$null || true
}

Write-Host "      Build API image (linux/amd64)..." -ForegroundColor Gray
Invoke-Step "      Build API image (hsbx-api:latest)" {
    docker buildx build -f apps/api/Dockerfile --platform linux/amd64 --load -t hsbx-api:latest .
}
Write-Host "      Build Web image (linux/amd64)..." -ForegroundColor Gray
Invoke-Step "      Build Web image (hsbx-web:latest) — bake API_URL = $API_URL" {
    docker buildx build -f apps/web/Dockerfile `
        --platform linux/amd64 --load `
        --build-arg NEXT_PUBLIC_API_URL=$API_URL `
        -t hsbx-web:latest .
}

# -----------------------------------------------------------------------
# [2/5] Xuất images thành file .tar
# -----------------------------------------------------------------------
Write-Host "`n[2/5] Xuất images thành .tar..." -ForegroundColor Yellow

Invoke-Step "      docker save hsbx-api.tar" {
    docker save -o hsbx-api.tar hsbx-api:latest
}
Invoke-Step "      docker save hsbx-web.tar" {
    docker save -o hsbx-web.tar hsbx-web:latest
}

# -----------------------------------------------------------------------
# [3/5] Chuyển files lên server qua SCP
# -----------------------------------------------------------------------
Write-Host "`n[3/5] Chuyển files lên ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}..." -ForegroundColor Yellow

Invoke-Step "      Tạo thư mục remote nếu chưa có" {
    ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p $REMOTE_PATH"
}
Invoke-Step "      SCP hsbx-api.tar  (~1.4 GB, chờ vài phút...)" {
    scp hsbx-api.tar "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/"
}
Invoke-Step "      SCP hsbx-web.tar" {
    scp hsbx-web.tar "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/"
}
Invoke-Step "      SCP docker-compose.prod.yml" {
    scp docker-compose.prod.yml "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/"
}
Invoke-Step "      SCP .env.server → .env" {
    scp .env.server "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/.env"
}

# -----------------------------------------------------------------------
# [4/5] SSH: load images + khởi động containers
# -----------------------------------------------------------------------
Write-Host "`n[4/5] Deploy containers trên server..." -ForegroundColor Yellow

$REMOTE_CMD = @"
set -e
cd $REMOTE_PATH
echo '>> Load API image...'
docker load -i hsbx-api.tar
echo '>> Load Web image...'
docker load -i hsbx-web.tar
echo '>> Retag images to match compose file...'
docker tag hsbx-api:latest namdn2470/seafool-api:latest
docker tag hsbx-web:latest namdn2470/seafool-web:latest
echo '>> Khoi dong containers...'
docker compose -f docker-compose.prod.yml up -d --force-recreate
echo '>> Don dep tar...'
rm -f hsbx-api.tar hsbx-web.tar
echo '>> Trang thai containers:'
docker compose -f docker-compose.prod.yml ps
"@

Invoke-Step "      SSH remote deploy" {
    ssh "${SERVER_USER}@${SERVER_IP}" $REMOTE_CMD
}

# -----------------------------------------------------------------------
# [5/5] Dọn dẹp .tar tại máy local
# -----------------------------------------------------------------------
Write-Host "`n[5/5] Don dep file .tar local..." -ForegroundColor Yellow
Remove-Item hsbx-api.tar, hsbx-web.tar -ErrorAction SilentlyContinue
Write-Host "      Xoa xong." -ForegroundColor Gray

# -----------------------------------------------------------------------
Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "  TRIEN KHAI HOAN TAT!" -ForegroundColor Green
Write-Host "  Trang chu : http://${SERVER_IP}:8082" -ForegroundColor Green
Write-Host "  Admin     : http://${SERVER_IP}:8082/admin/login" -ForegroundColor Green
Write-Host "  API       : http://${SERVER_IP}:3002/api" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
