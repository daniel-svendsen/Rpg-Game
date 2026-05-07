param(
    [switch]$CleanBackend
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $projectRoot "dev.local.properties"
$runDirectory = Join-Path $projectRoot ".run"
$frontendLogPath = Join-Path $runDirectory "frontend.log"
$frontendErrorLogPath = Join-Path $runDirectory "frontend.error.log"
$backendLogPath = Join-Path $runDirectory "backend.log"
$backendErrorLogPath = Join-Path $runDirectory "backend.error.log"
$frontendPidPath = Join-Path $runDirectory "frontend.pid"
$backendPidPath = Join-Path $runDirectory "backend.pid"
$defaultDevBackendPort = 8081

if (-not (Test-Path $configPath)) {
    Write-Host "Missing dev.local.properties. Copy dev.local.properties.example and fill in your local values."
    exit 1
}

New-Item -ItemType Directory -Force -Path $runDirectory | Out-Null

& (Join-Path $projectRoot "stop-dev.ps1")

$properties = @{}

Get-Content $configPath | ForEach-Object {
    $line = $_.Trim()

    if ($line.Length -eq 0 -or $line.StartsWith("#")) {
        return
    }

    $parts = $line -split "=", 2

    if ($parts.Count -eq 2) {
        $properties[$parts[0].Trim()] = $parts[1].Trim()
    }
}

$frontendApiBaseUrl = $properties["VITE_API_BASE_URL"]
$frontendWorkingDirectory = Join-Path $projectRoot "frontend"
$backendWorkingDirectory = Join-Path $projectRoot "backend"
$configuredBackendPort = $properties["APP_PORT"]
$backendPort = $defaultDevBackendPort

if (-not [string]::IsNullOrWhiteSpace($configuredBackendPort)) {
    $parsedBackendPort = 0

    if ([int]::TryParse($configuredBackendPort, [ref]$parsedBackendPort) -and $parsedBackendPort -gt 0) {
        $backendPort = $parsedBackendPort
    }
}

if ($backendPort -eq 8080) {
    Write-Host "Local dev backend port 8080 conflicts with the demo tunnel target. Using port $defaultDevBackendPort instead."
    $backendPort = $defaultDevBackendPort
}

$frontendDevProxyTarget = "http://127.0.0.1:$backendPort"

if (-not [string]::IsNullOrWhiteSpace($frontendApiBaseUrl) -and $frontendApiBaseUrl -match "^https?://(localhost|127\.0\.0\.1)(:\d+)?/?$") {
    $frontendApiBaseUrl = ""
}

Remove-Item $frontendLogPath, $frontendErrorLogPath, $backendLogPath, $backendErrorLogPath -Force -ErrorAction SilentlyContinue

$frontendCommand = if ([string]::IsNullOrWhiteSpace($frontendApiBaseUrl)) {
    "`$env:VITE_DEV_PROXY_TARGET='$frontendDevProxyTarget'; Set-Location '$frontendWorkingDirectory'; npm run dev -- --host 0.0.0.0"
} else {
    "`$env:VITE_API_BASE_URL='$frontendApiBaseUrl'; `$env:VITE_DEV_PROXY_TARGET='$frontendDevProxyTarget'; Set-Location '$frontendWorkingDirectory'; npm run dev -- --host 0.0.0.0"
}

$backendCommand = if ($CleanBackend) {
    "`$env:APP_PORT='$backendPort'; Set-Location '$backendWorkingDirectory'; mvn clean spring-boot:run"
} else {
    "`$env:APP_PORT='$backendPort'; Set-Location '$backendWorkingDirectory'; mvn spring-boot:run"
}

$backendProcess = Start-Process `
    -FilePath "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" `
    -ArgumentList @("-NoLogo", "-NoProfile", "-Command", $backendCommand) `
    -WorkingDirectory $backendWorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $backendLogPath `
    -RedirectStandardError $backendErrorLogPath `
    -PassThru

function Wait-ForPort {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port,
        [int]$TimeoutSeconds = 40
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

            if ($connections) {
                return $true
            }
        } catch {
            # ignore polling failures
        }

        Start-Sleep -Milliseconds 400
    }

    return $false
}

$backendReady = Wait-ForPort -Port $backendPort -TimeoutSeconds 45

if (-not $backendReady) {
    Write-Host "Backend did not start listening on port $backendPort within the expected time."
    Write-Host "Check backend logs: $backendErrorLogPath"
}

$frontendProcess = Start-Process `
    -FilePath "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" `
    -ArgumentList @("-NoLogo", "-NoProfile", "-Command", $frontendCommand) `
    -WorkingDirectory $frontendWorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $frontendLogPath `
    -RedirectStandardError $frontendErrorLogPath `
    -PassThru

Set-Content -Path $frontendPidPath -Value $frontendProcess.Id
Set-Content -Path $backendPidPath -Value $backendProcess.Id

Write-Host "Frontend started in background on port 5173."

if ($CleanBackend) {
    Write-Host "Backend started with Maven clean on port $backendPort."
} else {
    Write-Host "Backend started on port $backendPort."
}

Write-Host "Frontend log: $frontendLogPath"
Write-Host "Frontend error log: $frontendErrorLogPath"
Write-Host "Backend log: $backendLogPath"
Write-Host "Backend error log: $backendErrorLogPath"
Write-Host "Run .\\stop-dev.ps1 to stop both services."
Write-Host "Use .\\start-dev.ps1 -CleanBackend when you want Maven clean before backend startup."
