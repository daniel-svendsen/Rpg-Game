$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runDirectory = Join-Path $projectRoot ".run"

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

Stop-ProcessByPort -Port 5173
Stop-ProcessByPort -Port 8080

if (Test-Path $runDirectory) {
    Get-ChildItem -Path $runDirectory -Filter "*.pid" -ErrorAction SilentlyContinue | ForEach-Object {
        $pidValue = Get-Content $_.FullName -ErrorAction SilentlyContinue

        if (-not [int]::TryParse($pidValue, [ref]$null)) {
            Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
            return
        }

        $parsedPid = 0
        [void][int]::TryParse($pidValue, [ref]$parsedPid)
        $process = Get-Process -Id $parsedPid -ErrorAction SilentlyContinue

        if ($null -ne $process) {
            Write-Host "Stopping tracked process $($process.ProcessName) (PID $parsedPid)."
            Stop-Process -Id $parsedPid -Force -ErrorAction SilentlyContinue
        }

        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Frontend and backend stop routine finished."
