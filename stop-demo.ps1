param(
    [switch]$StopBackend
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runDirectory = Join-Path $projectRoot ".run"
$tunnelPidPath = Join-Path $runDirectory "cloudflared.pid"

if (Test-Path $tunnelPidPath) {
    $pidValue = Get-Content $tunnelPidPath -ErrorAction SilentlyContinue
    $parsedPid = 0

    if ([int]::TryParse($pidValue, [ref]$parsedPid)) {
        $process = Get-Process -Id $parsedPid -ErrorAction SilentlyContinue

        if ($null -ne $process) {
            Write-Host "Stopping cloudflared (PID $parsedPid)."
            Stop-Process -Id $parsedPid -Force -ErrorAction SilentlyContinue
        }
    }

    Remove-Item $tunnelPidPath -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "No tracked cloudflared process found."
}

if ($StopBackend) {
    Write-Host "Stopping Docker Compose services..."
    docker compose down
}

Write-Host "Demo stop routine finished."
