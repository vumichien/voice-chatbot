@echo off
REM Voice Chatbot Deployment Script for Windows
REM Quick deployment script for both backend and frontend

setlocal enabledelayedexpansion

echo ==========================================
echo Voice Chatbot Deployment Script
echo ==========================================
echo.

REM Check if vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Vercel CLI not found
    echo Install it with: npm install -g vercel
    pause
    exit /b 1
)

:menu
echo What would you like to deploy?
echo 1) Backend only
echo 2) Frontend only
echo 3) Both (backend first, then frontend)
echo 4) Exit
echo.
set /p choice="Enter choice [1-4]: "

if "%choice%"=="1" goto deploy_backend
if "%choice%"=="2" goto deploy_frontend
if "%choice%"=="3" goto deploy_both
if "%choice%"=="4" goto end
echo Invalid choice
goto menu

:deploy_backend
echo.
echo Deploying Backend...
cd backend

REM Check if .env exists
if not exist .env (
    echo Warning: .env file not found in backend directory
    echo Please create .env file before deploying
    cd ..
    pause
    exit /b 1
)

REM Update environment variables to Vercel
echo.
echo Updating environment variables to Vercel...
echo This may take a moment...
echo.

REM Use Node.js script to sync .env to Vercel (preferred)
if exist scripts\sync-env-to-vercel.js (
    call node scripts\sync-env-to-vercel.js production
    if !ERRORLEVEL! NEQ 0 (
        echo Warning: Failed to sync some environment variables
        echo You may need to set them manually in Vercel Dashboard
        echo.
    )
) else if exist scripts\sync-env-to-vercel.ps1 (
    REM Fallback to PowerShell script
    powershell -ExecutionPolicy Bypass -File scripts\sync-env-to-vercel.ps1
    if !ERRORLEVEL! NEQ 0 (
        echo Warning: Failed to sync some environment variables
        echo You may need to set them manually in Vercel Dashboard
        echo.
    )
) else (
    echo Warning: sync-env-to-vercel script not found
    echo Skipping environment variable sync
    echo Please set environment variables manually in Vercel Dashboard
    echo Or run: vercel env add VARIABLE_NAME production
    echo.
)

call vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo Backend deployment failed
    cd ..
    pause
    exit /b 1
)
echo.
echo Backend deployed successfully!
echo Backend URL: https://backend-vumichies-projects.vercel.app
echo.
cd ..
if "%choice%"=="1" goto test_deployments
goto deploy_frontend_step

:deploy_frontend
echo.
:deploy_frontend_step
echo Deploying Frontend...
cd frontend

REM Check if .env exists
if not exist .env (
    echo Creating .env file...
    echo VITE_API_URL=https://backend-vumichies-projects.vercel.app/api > .env
)

REM Build locally first
echo Building frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed
    cd ..
    pause
    exit /b 1
)

call vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo Frontend deployment failed
    cd ..
    pause
    exit /b 1
)
echo.
echo Frontend deployed successfully!
echo Frontend URL: https://frontend-vumichies-projects.vercel.app
echo.
cd ..
goto test_deployments

:deploy_both
call :deploy_backend
if %ERRORLEVEL% NEQ 0 exit /b 1
call :deploy_frontend_step
if %ERRORLEVEL% NEQ 0 exit /b 1
goto test_deployments

:test_deployments
echo.
echo Testing deployments...
echo Testing backend health endpoint...
curl -s https://backend-vumichies-projects.vercel.app/api/health | findstr "ok" >nul
if %ERRORLEVEL% EQU 0 (
    echo Backend health check passed!
) else (
    echo Backend health check failed
)

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Frontend: https://frontend-vumichies-projects.vercel.app
echo Backend:  https://backend-vumichies-projects.vercel.app
echo.
goto end

:end
pause
