$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runDirectory = Join-Path $projectRoot ".run"
$frontendWorkingDirectory = Join-Path $projectRoot "frontend"
$frontendLogPath = Join-Path $runDirectory "frontend.log"
$frontendErrorLogPath = Join-Path $runDirectory "frontend.error.log"
$frontendPidPath = Join-Path $runDirectory "frontend.pid"
$demoBackendUrl = "https://rpg-api.svendsenphotography.com"

New-Item -ItemType Directory -Force -Path $runDirectory | Out-Null

& (Join-Path $projectRoot "stop-dev.ps1")

Remove-Item $frontendLogPath, $frontendErrorLogPath -Force -ErrorAction SilentlyContinue

$frontendCommand =
    "`$env:VITE_API_BASE_URL='$demoBackendUrl'; Set-Location '$frontendWorkingDirectory'; npm run dev -- --host 0.0.0.0"

$frontendProcess = Start-Process `
    -FilePath "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" `
    -ArgumentList @("-NoLogo", "-NoProfile", "-Command", $frontendCommand) `
    -WorkingDirectory $frontendWorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $frontendLogPath `
    -RedirectStandardError $frontendErrorLogPath `
    -PassThru

Set-Content -Path $frontendPidPath -Value $frontendProcess.Id

Write-Host "Frontend started in background on port 5173."
Write-Host "Frontend is using the demo backend: $demoBackendUrl"
Write-Host "This mode does not start a local backend."
Write-Host "Frontend log: $frontendLogPath"
Write-Host "Frontend error log: $frontendErrorLogPath"
Write-Host "Run .\stop-dev.ps1 to stop the frontend."
