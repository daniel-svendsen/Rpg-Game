param(
    [string]$VerificationDatabasePrefix = "shardborne_verify",
    [int]$VerificationPort = 18081,
    [int]$StartupTimeoutSeconds = 90
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $projectRoot "dev.local.properties"
$runDirectory = Join-Path $projectRoot ".run"
$backendWorkingDirectory = Join-Path $projectRoot "backend"
$backendLogPath = Join-Path $runDirectory "verify-fresh-backend.log"
$backendJob = $null
$verificationDatabaseName = "{0}_{1}" -f $VerificationDatabasePrefix, ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())

function Quote-PowerShellLiteral([string]$value) {
    return "'" + ($value -replace "'", "''") + "'"
}

function Invoke-PsqlCommand(
    [string]$databaseName,
    [string]$serverHost,
    [int]$serverPort,
    [string]$username,
    [string]$password,
    [string]$sql
) {
    $env:PGPASSWORD = $password

    try {
        return & psql `
            --host $serverHost `
            --port $serverPort `
            --username $username `
            --dbname $databaseName `
            --tuples-only `
            --no-align `
            --command $sql
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

if (-not (Test-Path $configPath)) {
    throw "Missing dev.local.properties. Copy dev.local.properties.example and fill in your local values."
}

New-Item -ItemType Directory -Force -Path $runDirectory | Out-Null
Remove-Item $backendLogPath -Force -ErrorAction SilentlyContinue

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

$databaseUrl = $properties["APP_DATABASE_URL"]
$databaseUsername = $properties["APP_DATABASE_USERNAME"]
$databasePassword = $properties["APP_DATABASE_PASSWORD"]
$jwtSecret = $properties["APP_JWT_SECRET"]

if ([string]::IsNullOrWhiteSpace($databaseUrl) -or [string]::IsNullOrWhiteSpace($databaseUsername) -or [string]::IsNullOrWhiteSpace($databasePassword)) {
    throw "dev.local.properties must define APP_DATABASE_URL, APP_DATABASE_USERNAME, and APP_DATABASE_PASSWORD."
}

if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = "verify-fresh-backend-db-local-secret-12345"
}

$jdbcPattern = "^jdbc:postgresql://(?<host>[^:/]+)(:(?<port>\d+))?/(?<database>[^?]+)"
$match = [regex]::Match($databaseUrl, $jdbcPattern)

if (-not $match.Success) {
    throw "APP_DATABASE_URL must look like jdbc:postgresql://host:port/database"
}

$databaseHost = $match.Groups["host"].Value
$databasePort = if ($match.Groups["port"].Success) { [int]$match.Groups["port"].Value } else { 5432 }
$maintenanceDatabaseName = "postgres"
$verificationJdbcUrl = "jdbc:postgresql://{0}:{1}/{2}" -f $databaseHost, $databasePort, $verificationDatabaseName

Write-Host "Creating verification database $verificationDatabaseName on ${databaseHost}:$databasePort..."
Invoke-PsqlCommand $maintenanceDatabaseName $databaseHost $databasePort $databaseUsername $databasePassword "create database ""$verificationDatabaseName"";" | Out-Null

try {
    $backendJob = Start-Job -ArgumentList @(
        $backendWorkingDirectory,
        $verificationJdbcUrl,
        $databaseUsername,
        $databasePassword,
        $jwtSecret,
        $VerificationPort,
        $backendLogPath
    ) -ScriptBlock {
        param(
            $jobBackendWorkingDirectory,
            $jobVerificationJdbcUrl,
            $jobDatabaseUsername,
            $jobDatabasePassword,
            $jobJwtSecret,
            $jobVerificationPort,
            $jobBackendLogPath
        )

        $ErrorActionPreference = "Stop"
        $env:APP_DATABASE_URL = $jobVerificationJdbcUrl
        $env:APP_DATABASE_USERNAME = $jobDatabaseUsername
        $env:APP_DATABASE_PASSWORD = $jobDatabasePassword
        $env:APP_JWT_SECRET = $jobJwtSecret
        $env:APP_PORT = [string]$jobVerificationPort
        $env:APP_SERVER_ADDRESS = "127.0.0.1"
        Set-Location $jobBackendWorkingDirectory
        mvn spring-boot:run 2>&1 | Tee-Object -FilePath $jobBackendLogPath -Append
    }

    $startupDeadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
    $startupVerified = $false

    while ((Get-Date) -lt $startupDeadline) {
        if ($backendJob.State -in @("Completed", "Failed", "Stopped")) {
            break
        }

        if (Test-Path $backendLogPath) {
            $backendLog = Get-Content $backendLogPath -Raw
            if ($backendLog -match "Started ShardborneApplication") {
                $startupVerified = $true
                break
            }
        }

        Start-Sleep -Seconds 2
        $backendJob = Get-Job -Id $backendJob.Id
    }

    if (-not $startupVerified) {
        $jobState = if ($backendJob) { $backendJob.State } else { "Unknown" }
        $logTail = if (Test-Path $backendLogPath) {
            (Get-Content $backendLogPath -Tail 60) -join [Environment]::NewLine
        } else {
            ""
        }
        throw "Backend failed to report successful startup within $StartupTimeoutSeconds seconds. Job state: $jobState.`nBackend log tail:`n$logTail"
    }

    Write-Host "Backend startup verified. Checking Flyway history..."
    $migrationRows = Invoke-PsqlCommand `
        $verificationDatabaseName `
        $databaseHost `
        $databasePort `
        $databaseUsername `
        $databasePassword `
        "select count(*) from flyway_schema_history where success = true;"

    $successfulMigrationCount = [int](($migrationRows | Select-Object -First 1).Trim())
    if ($successfulMigrationCount -lt 4) {
        throw "Expected at least 4 successful Flyway migrations, found $successfulMigrationCount."
    }

    $characterTableCheck = Invoke-PsqlCommand `
        $verificationDatabaseName `
        $databaseHost `
        $databasePort `
        $databaseUsername `
        $databasePassword `
        "select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'character_profile';"

    $characterTableCount = [int](($characterTableCheck | Select-Object -First 1).Trim())
    if ($characterTableCount -ne 1) {
        throw "Expected character_profile table to exist after migration."
    }

    Write-Host "Fresh database migration verification passed."
    Write-Host "Log: $backendLogPath"
} finally {
    if ($backendJob) {
        if ($backendJob.State -notin @("Completed", "Failed", "Stopped")) {
            Stop-Job -Id $backendJob.Id
        }
        Remove-Job -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    }

    Write-Host "Dropping verification database $verificationDatabaseName..."
    Invoke-PsqlCommand `
        $maintenanceDatabaseName `
        $databaseHost `
        $databasePort `
        $databaseUsername `
        $databasePassword `
        "select pg_terminate_backend(pid) from pg_stat_activity where datname = '$verificationDatabaseName' and pid <> pg_backend_pid();" | Out-Null
    Invoke-PsqlCommand `
        $maintenanceDatabaseName `
        $databaseHost `
        $databasePort `
        $databaseUsername `
        $databasePassword `
        "drop database if exists ""$verificationDatabaseName"";" | Out-Null
}
