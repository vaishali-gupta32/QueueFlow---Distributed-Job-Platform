# QueueFlow One-Click Deployment Script for Windows (PowerShell)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " QueueFlow Production Deployment Script   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Check Docker status
Write-Host "`n[1/4] Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker daemon is not running. Starting Docker Desktop..." -ForegroundColor Red
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Start-Sleep -Seconds 15
    }
    Write-Host "Docker Engine is active." -ForegroundColor Green
} catch {
    Write-Host "Error checking Docker: $_" -ForegroundColor Red
    exit 1
}

# 2. Build & Launch Docker Compose Stack
Write-Host "`n[2/4] Building and launching Docker services..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to launch Docker containers." -ForegroundColor Red
    exit 1
}

# 3. Wait for PostgreSQL container health check
Write-Host "`n[3/4] Waiting for database initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 4. Run Prisma database migration and seed
Write-Host "`n[4/4] Executing database migrations and seeding..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec -T api npx prisma db seed

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " QueueFlow Deployment Complete!           " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Web Dashboard:  http://localhost:3000" -ForegroundColor Cyan
Write-Host " REST API:       http://localhost:4000" -ForegroundColor Cyan
Write-Host " Swagger Docs:   http://localhost:4000/api/docs" -ForegroundColor Cyan
