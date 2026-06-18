param(
    [switch]$BuildBackend,
    [ValidateSet("LocalDev", "PublicDemo")]
    [string]$Mode = "LocalDev",
    [ValidateSet("quick", "named")]
    [string]$TunnelMode = "named",
    [string]$NamedTunnelName = "rpg-game-backend"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runDirectory = Join-Path $projectRoot ".run"
$tunnelLogPath = Join-Path $runDirectory "cloudflared.log"
$tunnelErrorLogPath = Join-Path $runDirectory "cloudflared.error.log"
$tunnelPidPath = Join-Path $runDirectory "cloudflared.pid"
$tunnelModePath = Join-Path $runDirectory "cloudflared.mode"
$defaultCloudflaredPath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"

function Resolve-CloudflaredPath {
    if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
        return "cloudflared"
    }

    if (Test-Path $defaultCloudflaredPath) {
        return $defaultCloudflaredPath
    }

    throw "Could not find cloudflared. Install it first or add it to PATH."
}

function Stop-TrackedTunnel {
    if (-not (Test-Path $tunnelPidPath)) {
        return
    }

    $pidValue = Get-Content $tunnelPidPath -ErrorAction SilentlyContinue
    $parsedPid = 0

    if ([int]::TryParse($pidValue, [ref]$parsedPid)) {
        $process = Get-Process -Id $parsedPid -ErrorAction SilentlyContinue

        if ($null -ne $process) {
            Write-Host "Stopping previous cloudflared process (PID $parsedPid)."
            Stop-Process -Id $parsedPid -Force -ErrorAction SilentlyContinue
        }
    }

    Remove-Item $tunnelPidPath -Force -ErrorAction SilentlyContinue
}

function Apply-DemoMode {
    param(
        [string]$SelectedMode
    )

    if ($SelectedMode -eq "PublicDemo") {
        $env:APP_SECURITY_PRODUCTION_MODE = "true"
        $env:APP_CLIENT_ALLOWED_ORIGIN_PATTERNS = "https://shardborne.pages.dev"

        Write-Host ""
        Write-Host "Starting PUBLIC DEMO mode"
        Write-Host "- APP_SECURITY_PRODUCTION_MODE=true"
        Write-Host "- CORS locked to https://shardborne.pages.dev"
        Write-Host "- Use this for Discord/Reddit test windows while this computer is online."
        Write-Host ""
        return
    }

    $env:APP_SECURITY_PRODUCTION_MODE = "false"
    $env:APP_CLIENT_ALLOWED_ORIGIN_PATTERNS = "http://localhost:*,http://127.0.0.1:*,http://192.168.*:*,http://10.*:*,http://172.16.*:*,http://172.17.*:*,http://172.18.*:*,http://172.19.*:*,http://172.20.*:*,http://172.21.*:*,http://172.22.*:*,http://172.23.*:*,http://172.24.*:*,http://172.25.*:*,http://172.26.*:*,http://172.27.*:*,http://172.28.*:*,http://172.29.*:*,http://172.30.*:*,http://172.31.*:*,https://*.pages.dev,https://*.github.io,https://*.trycloudflare.com,capacitor://localhost,ionic://localhost"

    Write-Host ""
    Write-Host "Starting LOCAL DEV demo mode"
    Write-Host "- APP_SECURITY_PRODUCTION_MODE=false"
    Write-Host "- CORS allows localhost/dev origins"
    Write-Host "- Use this when testing with npm run dev or local devices."
    Write-Host ""
}

if (-not (Test-Path (Join-Path $projectRoot ".env"))) {
    Write-Host "Missing .env. Copy compose.env.example to .env and fill in local demo values."
    exit 1
}

New-Item -ItemType Directory -Force -Path $runDirectory | Out-Null

$cloudflaredPath = Resolve-CloudflaredPath

Stop-TrackedTunnel

Remove-Item $tunnelLogPath, $tunnelErrorLogPath -Force -ErrorAction SilentlyContinue

Apply-DemoMode -SelectedMode $Mode

Write-Host "Starting backend and database with Docker Compose..."

if ($BuildBackend) {
    docker compose up --build -d
} else {
    docker compose up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker Compose failed to start the demo backend. Cloudflare tunnel startup aborted."
    exit $LASTEXITCODE
}

if ($TunnelMode -eq "named") {
    Write-Host "Starting Cloudflare named tunnel '$NamedTunnelName'..."
    $cloudflaredArguments = @("tunnel", "run", $NamedTunnelName)
} else {
    Write-Host "Starting Cloudflare Quick Tunnel..."
    $cloudflaredArguments = @("tunnel", "--url", "http://localhost:8080")
}

$cloudflaredProcess = Start-Process `
    -FilePath $cloudflaredPath `
    -ArgumentList $cloudflaredArguments `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $tunnelLogPath `
    -RedirectStandardError $tunnelErrorLogPath `
    -PassThru

Set-Content -Path $tunnelPidPath -Value $cloudflaredProcess.Id
Set-Content -Path $tunnelModePath -Value $TunnelMode

if ($TunnelMode -eq "named") {
    Write-Host ""
    Write-Host "Demo backend is running through the named tunnel."
    Write-Host "Backend URL: https://rpg-api.svendsenphotography.com"
    Write-Host "Cloudflared log: $tunnelLogPath"
    Write-Host "Cloudflared error log: $tunnelErrorLogPath"
    Write-Host "Run .\stop-demo.ps1 to stop the tunnel and Docker. Add -KeepBackend if you want to leave Docker running."
    exit 0
}

$deadline = (Get-Date).AddSeconds(30)
$publicUrl = $null
$logCandidates = @($tunnelLogPath, $tunnelErrorLogPath)

while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 500

    $publicUrl = $logCandidates |
        Where-Object { Test-Path $_ } |
        ForEach-Object {
            Select-String -Path $_ -Pattern "https://[A-Za-z0-9-]+\.trycloudflare\.com" -AllMatches |
                ForEach-Object { $_.Matches.Value }
        } |
        Select-Object -First 1

    if (-not [string]::IsNullOrWhiteSpace($publicUrl)) {
        break
    }
}

if ([string]::IsNullOrWhiteSpace($publicUrl)) {
    Write-Host "Cloudflare tunnel started, but no public URL was detected yet."
    Write-Host "Check: $tunnelLogPath"
    Write-Host "Check: $tunnelErrorLogPath"
    exit 1
}

Write-Host ""
Write-Host "Demo backend is running."
Write-Host "Public backend URL: $publicUrl"
Write-Host "Update VITE_API_BASE_URL in Cloudflare Pages if this URL changed, then redeploy the frontend."
Write-Host "Cloudflared log: $tunnelLogPath"
Write-Host "Cloudflared error log: $tunnelErrorLogPath"
Write-Host "Run .\stop-demo.ps1 to stop the tunnel and Docker. Add -KeepBackend if you want to leave Docker running."
