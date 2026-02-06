# run-mobile.ps1
# One-command workflow: builds, serves, and opens on mobile
# Usage: .\scripts\run-mobile.ps1 [--no-build] [--port 5000]

param(
  [switch]$NoBuild,
  [int]$Port = 5000
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DRK Attendance System - Mobile Run     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build if not skipped
if (-not $NoBuild) {
  Write-Host "[1/3] Building production bundle..." -ForegroundColor Yellow
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
  }
  Write-Host "Build complete" -ForegroundColor Green
  Write-Host ""
} else {
  Write-Host "[1/3] Skipping build (flag used)" -ForegroundColor Gray
  Write-Host ""
}

# Step 2: Start serve in background
Write-Host "[2/3] Starting server on port $Port..." -ForegroundColor Yellow
$port = $Port
$serveJob = Start-Job -ScriptBlock {
  & npm exec serve -- -s dist -l $using:port
} -ErrorAction SilentlyContinue

if (-not $serveJob) {
  Write-Host "Failed to start server. Is 'serve' installed? Run: npm install -g serve" -ForegroundColor Red
  exit 1
}
Write-Host "Server started (Job: $($serveJob.Id))" -ForegroundColor Green
Write-Host ""

# Short delay for server to boot
Start-Sleep -Seconds 2

# Step 3: Get IP and open on mobile
Write-Host "[3/3] Opening on mobile..." -ForegroundColor Yellow
$ipObj = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias '*' -ErrorAction SilentlyContinue |
      Where-Object { $_.IPAddress -and $_.PrefixOrigin -ne 'WellKnown' -and $_.IPAddress -notlike '169.*' } |
      Sort-Object -Property ifIndex -Descending | Select-Object -First 1
$ip = if ($ipObj) { $ipObj.IPAddress } else { '127.0.0.1' }

$lanUrl = "http://$($ip):$Port"
Write-Host ""
Write-Host "Your app is running at:" -ForegroundColor Green
Write-Host "  LAN  : $lanUrl" -ForegroundColor Cyan
Write-Host "  QR   : (opening scanner below)" -ForegroundColor Cyan

Write-Host ""
Write-Host "Starting HTTPS tunnel for mobile (camera features work here)..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C in the tunnel to stop the entire session." -ForegroundColor Gray
Write-Host ""

npx localtunnel --port $Port

# Cleanup: stop the serve job when tunnel exits
Write-Host ""
Write-Host "Closing server..." -ForegroundColor Yellow
Stop-Job -Job $serveJob -ErrorAction SilentlyContinue
Remove-Job -Job $serveJob -ErrorAction SilentlyContinue
Write-Host "Done!" -ForegroundColor Green
