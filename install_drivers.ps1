# Script de instalación automática de drivers SQL Server para PHP
# Ejecutar como Administrador

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   ExosBank - Instalador de Drivers" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Obtener información de PHP
Write-Host "1. Verificando instalación de PHP..." -ForegroundColor Yellow
try {
    $phpVersion = php -r "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;"
    $phpZTS = php -r "echo PHP_ZTS ? 'ts' : 'nts';"
    $phpArch = php -r "echo PHP_INT_SIZE === 8 ? 'x64' : 'x86';"
    $phpExtDir = php -r "echo ini_get('extension_dir');"
    
    Write-Host "   PHP Version: $phpVersion" -ForegroundColor Green
    Write-Host "   Thread Safe: $phpZTS" -ForegroundColor Green
    Write-Host "   Architecture: $phpArch" -ForegroundColor Green
    Write-Host "   Extensions Dir: $phpExtDir" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: PHP no encontrado. Instala XAMPP primero." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Determinar versión de PHP para descargar
$phpMajorMinor = $phpVersion.Replace('.', '')
if ($phpMajorMinor -notin @('80', '81', '82', '83')) {
    Write-Host "   ERROR: Versión de PHP $phpVersion no soportada" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Crear directorio temporal
Write-Host ""
Write-Host "2. Preparando descarga..." -ForegroundColor Yellow
$tempDir = "$env:TEMP\exosbank_sqlsrv"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Descargar drivers
Write-Host ""
Write-Host "3. Descargando drivers SQL Server para PHP $phpVersion..." -ForegroundColor Yellow
$downloadUrl = "https://github.com/microsoft/msphpsql/releases/download/v5.10.1/Windows-$phpVersion.zip"
$zipFile = "$tempDir\php_sqlsrv.zip"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "   Descarga completada" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: No se pudo descargar. Verifica tu conexión a Internet." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Extraer archivos
Write-Host ""
Write-Host "4. Extrayendo archivos..." -ForegroundColor Yellow
Expand-Archive -Path $zipFile -DestinationPath "$tempDir\extracted" -Force
Write-Host "   Archivos extraídos" -ForegroundColor Green

# Copiar DLLs correctos
Write-Host ""
Write-Host "5. Instalando drivers..." -ForegroundColor Yellow
$dllPath = "$tempDir\extracted\Windows-$phpVersion\$phpArch"
$dllFiles = @(
    "php_sqlsrv_$($phpMajorMinor)_$phpZTS.dll",
    "php_pdo_sqlsrv_$($phpMajorMinor)_$phpZTS.dll"
)

foreach ($dll in $dllFiles) {
    $sourcePath = Join-Path $dllPath $dll
    $destPath = Join-Path $phpExtDir $dll
    
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "   $dll instalado" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: No se encontró $dll" -ForegroundColor Red
    }
}

# Actualizar php.ini
Write-Host ""
Write-Host "6. Configurando php.ini..." -ForegroundColor Yellow
$phpIniPath = php --ini | Select-String "Loaded Configuration File:" | ForEach-Object { $_.ToString().Split(':')[1].Trim() }

if (Test-Path $phpIniPath) {
    $phpIniContent = Get-Content $phpIniPath
    $modified = $false
    
    # Verificar y agregar extensiones
    foreach ($dll in $dllFiles) {
        $extName = $dll.Replace('.dll', '')
        $extLine = "extension=$extName"
        
        if ($phpIniContent -notcontains $extLine) {
            Add-Content -Path $phpIniPath -Value $extLine
            Write-Host "   Agregada extensión: $extName" -ForegroundColor Green
            $modified = $true
        } else {
            Write-Host "   Extensión ya existe: $extName" -ForegroundColor Cyan
        }
    }
    
    if ($modified) {
        Write-Host "   php.ini actualizado" -ForegroundColor Green
    }
} else {
    Write-Host "   ADVERTENCIA: No se encontró php.ini" -ForegroundColor Yellow
}

# Verificar ODBC Driver
Write-Host ""
Write-Host "7. Verificando ODBC Driver 17 for SQL Server..." -ForegroundColor Yellow
$odbcDriver = Get-ItemProperty -Path 'HKLM:\SOFTWARE\ODBC\ODBCINST.INI\ODBC Driver 17 for SQL Server' -ErrorAction SilentlyContinue

if ($odbcDriver) {
    Write-Host "   ODBC Driver 17 ya está instalado" -ForegroundColor Green
} else {
    Write-Host "   ODBC Driver 17 NO está instalado" -ForegroundColor Yellow
    Write-Host "   Descargando e instalando..." -ForegroundColor Yellow
    
    $odbcUrl = "https://go.microsoft.com/fwlink/?linkid=2249004"
    $odbcInstaller = "$tempDir\msodbcsql.msi"
    
    try {
        Invoke-WebRequest -Uri $odbcUrl -OutFile $odbcInstaller -UseBasicParsing
        Start-Process msiexec.exe -ArgumentList "/i `"$odbcInstaller`" /quiet /qn /norestart IACCEPTMSODBCSQLLICENSETERMS=YES" -Wait
        Write-Host "   ODBC Driver 17 instalado" -ForegroundColor Green
    } catch {
        Write-Host "   ERROR: Instala manualmente desde: $odbcUrl" -ForegroundColor Red
    }
}

# Verificar extensiones cargadas
Write-Host ""
Write-Host "8. Verificando instalación..." -ForegroundColor Yellow
$loadedExtensions = php -m | Select-String "sqlsrv"

if ($loadedExtensions) {
    Write-Host "   Extensiones cargadas correctamente:" -ForegroundColor Green
    $loadedExtensions | ForEach-Object { Write-Host "   - $_" -ForegroundColor Green }
} else {
    Write-Host "   ADVERTENCIA: Las extensiones no están cargadas" -ForegroundColor Yellow
    Write-Host "   Reinicia Apache en el Panel de Control de XAMPP" -ForegroundColor Yellow
}

# Verificar archivo .env
Write-Host ""
Write-Host "9. Verificando configuración..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   Archivo .env encontrado" -ForegroundColor Green
} else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "   Archivo .env creado desde .env.example" -ForegroundColor Green
        Write-Host "   IMPORTANTE: Edita .env con las credenciales reales" -ForegroundColor Yellow
    } else {
        Write-Host "   ADVERTENCIA: No se encontró .env ni .env.example" -ForegroundColor Yellow
    }
}

# Limpiar archivos temporales
Write-Host ""
Write-Host "10. Limpiando archivos temporales..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "    Limpieza completada" -ForegroundColor Green

# Resumen final
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Instalación Completada" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Reinicia Apache en el Panel de Control de XAMPP" -ForegroundColor White
Write-Host "2. Edita el archivo .env con las credenciales reales" -ForegroundColor White
Write-Host "3. Agrega tu IP al firewall de Azure SQL" -ForegroundColor White
Write-Host "4. Ejecuta: php test_connection.php" -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter para salir"
