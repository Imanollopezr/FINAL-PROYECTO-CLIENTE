# Script de limpieza automática para el proyecto PetLove
# Este script elimina archivos temporales y optimiza el tamaño del proyecto

Write-Host "=== SCRIPT DE LIMPIEZA DEL PROYECTO PETLOVE ===" -ForegroundColor Green
Write-Host "Iniciando limpieza automática..." -ForegroundColor Yellow
Write-Host ""

# Obtener el directorio del proyecto
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Directorio del proyecto: $projectRoot" -ForegroundColor Cyan

# Función para mostrar el tamaño de una carpeta
function Get-FolderSize {
    param([string]$Path)
    if (Test-Path $Path) {
        $size = (Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        return [math]::Round($size / 1MB, 2)
    }
    return 0
}

# Función para eliminar carpeta si existe
function Remove-FolderIfExists {
    param([string]$Path, [string]$Description)
    if (Test-Path $Path) {
        $size = Get-FolderSize -Path $Path
        Write-Host "Eliminando $Description ($size MB)..." -ForegroundColor Yellow
        Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✓ $Description eliminado" -ForegroundColor Green
        return $size
    } else {
        Write-Host "- $Description no encontrado" -ForegroundColor Gray
        return 0
    }
}

# Calcular tamaño inicial
$initialSize = Get-FolderSize -Path $projectRoot
Write-Host "Tamaño inicial del proyecto: $initialSize MB" -ForegroundColor Cyan
Write-Host ""

$totalCleaned = 0

# 1. Limpiar node_modules
Write-Host "1. Limpiando dependencias de Node.js..." -ForegroundColor Magenta
$totalCleaned += Remove-FolderIfExists -Path "$projectRoot\node_modules" -Description "node_modules"

# 2. Limpiar archivos de build del frontend
Write-Host "`n2. Limpiando archivos de build del frontend..." -ForegroundColor Magenta
$totalCleaned += Remove-FolderIfExists -Path "$projectRoot\dist" -Description "dist"
$totalCleaned += Remove-FolderIfExists -Path "$projectRoot\build" -Description "build"
$totalCleaned += Remove-FolderIfExists -Path "$projectRoot\.vite" -Description ".vite"

# 3. Limpiar archivos de compilación .NET
Write-Host "`n3. Limpiando archivos de compilación .NET..." -ForegroundColor Magenta

# Buscar y eliminar todas las carpetas bin y obj
Get-ChildItem -Path "$projectRoot\api-backend" -Recurse -Directory -Name "bin" -ErrorAction SilentlyContinue | ForEach-Object {
    $binPath = "$projectRoot\api-backend\$_"
    $totalCleaned += Remove-FolderIfExists -Path $binPath -Description "bin ($binPath)"
}

Get-ChildItem -Path "$projectRoot\api-backend" -Recurse -Directory -Name "obj" -ErrorAction SilentlyContinue | ForEach-Object {
    $objPath = "$projectRoot\api-backend\$_"
    $totalCleaned += Remove-FolderIfExists -Path $objPath -Description "obj ($objPath)"
}

# 4. Limpiar archivos de cache
Write-Host "`n4. Limpiando archivos de cache..." -ForegroundColor Magenta
$totalCleaned += Remove-FolderIfExists -Path "$projectRoot\.cache" -Description ".cache"
$totalCleaned += Remove-FolderIfExists -Path "$projectRoot\.parcel-cache" -Description ".parcel-cache"
$totalCleaned += Remove-FolderIfExists -Path "$projectRoot\.npm" -Description ".npm"

# 5. Limpiar archivos temporales
Write-Host "`n5. Limpiando archivos temporales..." -ForegroundColor Magenta
$tempFiles = @("*.tmp", "*.temp", "*.log", "*.bak", "*.backup", "*.old")
foreach ($pattern in $tempFiles) {
    $files = Get-ChildItem -Path $projectRoot -Recurse -Filter $pattern -ErrorAction SilentlyContinue
    if ($files.Count -gt 0) {
        Write-Host "Eliminando archivos $pattern..." -ForegroundColor Yellow
        $files | Remove-Item -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Archivos $pattern eliminados ($($files.Count) archivos)" -ForegroundColor Green
    }
}

# 6. Ejecutar dotnet clean en el backend
Write-Host "`n6. Ejecutando dotnet clean..." -ForegroundColor Magenta
if (Test-Path "$projectRoot\api-backend") {
    Push-Location "$projectRoot\api-backend"
    try {
        $cleanOutput = dotnet clean 2>&1
        Write-Host "✓ dotnet clean ejecutado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Error al ejecutar dotnet clean: $_" -ForegroundColor Yellow
    }
    Pop-Location
}

# Calcular tamaño final
Write-Host "`n=== RESUMEN DE LIMPIEZA ===" -ForegroundColor Green
$finalSize = Get-FolderSize -Path $projectRoot
$savedSpace = $initialSize - $finalSize

Write-Host "Tamaño inicial: $initialSize MB" -ForegroundColor Cyan
Write-Host "Tamaño final: $finalSize MB" -ForegroundColor Cyan
Write-Host "Espacio liberado: $savedSpace MB" -ForegroundColor Green
Write-Host "Porcentaje reducido: $([math]::Round(($savedSpace / $initialSize) * 100, 1))%" -ForegroundColor Green

Write-Host "`n✓ Limpieza completada exitosamente!" -ForegroundColor Green
Write-Host "`nPara restaurar las dependencias:" -ForegroundColor Yellow
Write-Host "  - Frontend: npm install" -ForegroundColor White
Write-Host "  - Backend: dotnet restore" -ForegroundColor White

# Pausa para que el usuario pueda ver los resultados
Write-Host "`nPresiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")