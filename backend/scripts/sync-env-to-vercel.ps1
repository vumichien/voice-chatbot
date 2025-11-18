# PowerShell script to sync .env file to Vercel environment variables
# Usage: .\sync-env-to-vercel.ps1

param(
    [string]$EnvFile = ".env",
    [string]$Environment = "production"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Syncing .env to Vercel" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: .env file not found at $EnvFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading .env file..." -ForegroundColor Yellow
$envVars = @{}

Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    
    # Skip comments and empty lines
    if ($line -and -not $line.StartsWith("#")) {
        $equalIndex = $line.IndexOf("=")
        if ($equalIndex -gt 0) {
            $key = $line.Substring(0, $equalIndex).Trim()
            $value = $line.Substring($equalIndex + 1).Trim()
            
            # Remove quotes if present
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            if ($value.StartsWith("'") -and $value.EndsWith("'")) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            
            if ($key) {
                $envVars[$key] = $value
            }
        }
    }
}

Write-Host "Found $($envVars.Count) environment variables" -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..." -NoNewline
    
    # Use vercel env add command with value piped to stdin
    $value | vercel env add $key $Environment --force 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host " [WARN] May already exist or failed" -ForegroundColor Yellow
        $failCount++
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Sync Complete!" -ForegroundColor Cyan
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Warnings: $failCount" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

