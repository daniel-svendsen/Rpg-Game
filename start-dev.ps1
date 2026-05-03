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

Remove-Item $frontendLogPath, $frontendErrorLogPath, $backendLogPath, $backendErrorLogPath -Force -ErrorAction SilentlyContinue

$frontendCommand = if ([string]::IsNullOrWhiteSpace($frontendApiBaseUrl)) {
    "Set-Location '$frontendWorkingDirectory'; npm run dev"
} else {
    "`$env:VITE_API_BASE_URL='$frontendApiBaseUrl'; Set-Location '$frontendWorkingDirectory'; npm run dev"
}

$backendCommand = if ($CleanBackend) {
    "Set-Location '$backendWorkingDirectory'; mvn clean spring-boot:run"
} else {
    "Set-Location '$backendWorkingDirectory'; mvn spring-boot:run"
}

$frontendProcess = Start-Process `
    -FilePath "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" `
    -ArgumentList @("-NoLogo", "-NoProfile", "-Command", $frontendCommand) `
    -WorkingDirectory $frontendWorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $frontendLogPath `
    -RedirectStandardError $frontendErrorLogPath `
    -PassThru

$backendProcess = Start-Process `
    -FilePath "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" `
    -ArgumentList @("-NoLogo", "-NoProfile", "-Command", $backendCommand) `
    -WorkingDirectory $backendWorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $backendLogPath `
    -RedirectStandardError $backendErrorLogPath `
    -PassThru

Set-Content -Path $frontendPidPath -Value $frontendProcess.Id
Set-Content -Path $backendPidPath -Value $backendProcess.Id

Write-Host "Frontend started in background on port 5173."

if ($CleanBackend) {
    Write-Host "Backend started with Maven clean on port 8080."
} else {
    Write-Host "Backend started on port 8080."
}

Write-Host "Frontend log: $frontendLogPath"
Write-Host "Frontend error log: $frontendErrorLogPath"
Write-Host "Backend log: $backendLogPath"
Write-Host "Backend error log: $backendErrorLogPath"
Write-Host "Run .\\stop-dev.ps1 to stop both services."
Write-Host "Use .\\start-dev.ps1 -CleanBackend when you want Maven clean before backend startup."
