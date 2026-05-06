$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runDirectory = Join-Path $projectRoot ".run"
$configPath = Join-Path $projectRoot "dev.local.properties"
$defaultDevBackendPort = 8081
$trackedDevPidFiles = @("frontend.pid", "backend.pid")

function Stop-ProcessByPort {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

    if (-not $connections) {
        Write-Host "No process is listening on port $Port."
        return
    }

    $processIds = $connections |
        Select-Object -ExpandProperty OwningProcess -Unique |
        Where-Object { $_ -gt 0 }

    foreach ($processId in $processIds) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

        if ($null -eq $process) {
            continue
        }

        Write-Host "Stopping process $($process.ProcessName) (PID $processId) on port $Port."
        Stop-Process -Id $processId -Force
    }
}

function Get-DevBackendPort {
    if (-not (Test-Path $configPath)) {
        return $defaultDevBackendPort
    }

    $configuredPort = $null

    Get-Content $configPath | ForEach-Object {
        $line = $_.Trim()

        if ($line.Length -eq 0 -or $line.StartsWith("#")) {
            return
        }

        $parts = $line -split "=", 2

        if ($parts.Count -eq 2 -and $parts[0].Trim() -eq "APP_PORT") {
            $configuredPort = $parts[1].Trim()
        }
    }

    if ([string]::IsNullOrWhiteSpace($configuredPort)) {
        return $defaultDevBackendPort
    }

    $parsedPort = 0

    if (-not [int]::TryParse($configuredPort, [ref]$parsedPort) -or $parsedPort -le 0 -or $parsedPort -eq 8080) {
        return $defaultDevBackendPort
    }

    return $parsedPort
}

Stop-ProcessByPort -Port 5173
Stop-ProcessByPort -Port (Get-DevBackendPort)

if (Test-Path $runDirectory) {
    foreach ($pidFileName in $trackedDevPidFiles) {
        $pidFilePath = Join-Path $runDirectory $pidFileName

        if (-not (Test-Path $pidFilePath)) {
            continue
        }

        $pidValue = Get-Content $pidFilePath -ErrorAction SilentlyContinue

        if (-not [int]::TryParse($pidValue, [ref]$null)) {
            Remove-Item $pidFilePath -Force -ErrorAction SilentlyContinue
            continue
        }

        $parsedPid = 0
        [void][int]::TryParse($pidValue, [ref]$parsedPid)
        $process = Get-Process -Id $parsedPid -ErrorAction SilentlyContinue

        if ($null -ne $process) {
            Write-Host "Stopping tracked process $($process.ProcessName) (PID $parsedPid)."
            Stop-Process -Id $parsedPid -Force -ErrorAction SilentlyContinue
        }

        Remove-Item $pidFilePath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Frontend and backend stop routine finished."
