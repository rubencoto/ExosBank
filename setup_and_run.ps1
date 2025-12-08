# Script de configuración y ejecución automática para ExosBank
# Este script verifica el entorno y lanza la aplicación

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   ExosBank - Setup & Run" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Configurar PHP
Write-Host "1. Verificando PHP..." -ForegroundColor Yellow
$phpPath = "C:\xampp\php"
if (Test-Path "$phpPath\php.exe") {
    Write-Host "   Agregando PHP al PATH..." -ForegroundColor Green
    $env:PATH = "$phpPath;$env:PATH"
} else {
    Write-Host "   ERROR: No se encontró PHP en C:\xampp\php." -ForegroundColor Red
    Write-Host "   Por favor instala XAMPP primero." -ForegroundColor Red
    exit 1
}
$phpVersion = php -r "echo PHP_VERSION;"
Write-Host "   PHP detectado: $phpVersion" -ForegroundColor Green

# 2. Verificar Node.js
Write-Host ""
Write-Host "2. Verificando Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "   ERROR: Node.js no está instalado o no está en el PATH." -ForegroundColor Red
    Write-Host "   El Frontend (React) requiere Node.js para funcionar." -ForegroundColor Red
    Write-Host "   Descárgalo aquí: https://nodejs.org/" -ForegroundColor Cyan
    
    # Intentar abrir la página de descarga
    Start-Process "https://nodejs.org/"
    exit 1
}
$nodeVersion = node -v
Write-Host "   Node.js detectado: $nodeVersion" -ForegroundColor Green

# 2.1 Verificar Drivers SQL Server
Write-Host ""
Write-Host "2.1. Verificando Drivers SQL Server..." -ForegroundColor Yellow
$driversLoaded = php -r "echo extension_loaded('sqlsrv') ? '1' : '0';"
if ($driversLoaded -eq '0') {
    Write-Host "   ADVERTENCIA: Drivers SQL Server no detectados." -ForegroundColor Yellow
    Write-Host "   Ejecutando instalador de drivers (requiere permisos de Administrador)..." -ForegroundColor Cyan
    
    $installScript = Join-Path $PSScriptRoot "install_drivers.ps1"
    if (Test-Path $installScript) {
        Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$installScript`"" -Verb RunAs -Wait
        Write-Host "   Instalador finalizado. Verifica si hubo errores." -ForegroundColor Green
    } else {
        Write-Host "   ERROR: No se encontró install_drivers.ps1" -ForegroundColor Red
    }
} else {
    Write-Host "   Drivers SQL Server detectados correctamente." -ForegroundColor Green
}

# 2.2 Verificar archivo .env
Write-Host ""
Write-Host "2.2. Verificando configuración (.env)..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot ".env"
$envExample = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "   AVISO: Se ha creado el archivo .env desde la plantilla." -ForegroundColor Yellow
        Write-Host "   IMPORTANTE: Tu compañero debe editar el archivo .env con las credenciales reales de la base de datos." -ForegroundColor Red
        Start-Process notepad $envFile
    } else {
        Write-Host "   ADVERTENCIA: No se encontró .env ni .env.example" -ForegroundColor Red
    }
} else {
    Write-Host "   Archivo .env encontrado." -ForegroundColor Green
}

# 3. Instalar dependencias del Frontend
Write-Host ""
Write-Host "3. Verificando dependencias del Frontend..." -ForegroundColor Yellow
$clientAppPath = Join-Path $PSScriptRoot "ClientApp"
if (-not (Test-Path "$clientAppPath\node_modules")) {
    Write-Host "   Instalando paquetes npm (esto puede tardar unos minutos)..." -ForegroundColor Cyan
    Push-Location $clientAppPath
    try {
        npm install
        Write-Host "   Dependencias instaladas correctamente." -ForegroundColor Green
    } catch {
        Write-Host "   ERROR: Falló la instalación de dependencias." -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
} else {
    Write-Host "   Dependencias ya instaladas." -ForegroundColor Green
}

# 4. Verificar conexión a Base de Datos (Opcional)
Write-Host ""
Write-Host "4. Verificando conexión a Base de Datos..." -ForegroundColor Yellow
try {
    php "$PSScriptRoot\test_connection.php"
} catch {
    Write-Host "   Advertencia: No se pudo verificar la conexión." -ForegroundColor Yellow
}

# 5. Iniciar Frontend
Write-Host ""
Write-Host "5. Iniciando Frontend..." -ForegroundColor Yellow
Write-Host "   La aplicación se abrirá en tu navegador..." -ForegroundColor Cyan

Push-Location $clientAppPath
npm run dev
