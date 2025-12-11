param(
    [Parameter(Mandatory=$true)]
    [string]$SqlFile
)

Write-Host "=== EJECUTANDO SCRIPT SQL ===" -ForegroundColor Green

$serverName = "localhost\SQLEXPRESS01"
$databaseName = "PetLove"

try {
    if (-not (Test-Path $SqlFile)) {
        Write-Host "Error: No se encontró el archivo $SqlFile" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Archivo SQL encontrado: $SqlFile" -ForegroundColor Green
    
    $sqlContent = Get-Content $SqlFile -Raw
    $sqlContent = $sqlContent -replace "USE PetLove;", ""
    
    $sqlCommands = $sqlContent -split "(?m)^\s*GO\s*$" | Where-Object { $_.Trim() -ne "" }
    
    Write-Host "Se encontraron $($sqlCommands.Count) comandos SQL para ejecutar" -ForegroundColor Cyan
    
    $connectionString = "Server=$serverName;Database=$databaseName;Integrated Security=true;TrustServerCertificate=true;Connection Timeout=60;"
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    
    Write-Host "Conectando a la base de datos $databaseName..." -ForegroundColor Yellow
    $connection.Open()
    Write-Host "✓ Conexión exitosa" -ForegroundColor Green
    
    $successCount = 0
    $errorCount = 0
    
    for ($i = 0; $i -lt $sqlCommands.Count; $i++) {
        $sqlCommand = $sqlCommands[$i].Trim()
        
        if ($sqlCommand -eq "") { continue }
        
        Write-Host "Ejecutando comando $($i + 1) de $($sqlCommands.Count)..." -ForegroundColor Yellow
        
        try {
            $command = New-Object System.Data.SqlClient.SqlCommand($sqlCommand, $connection)
            $command.CommandTimeout = 300
            $result = $command.ExecuteNonQuery()
            $successCount++
            
            if (($i + 1) % 5 -eq 0) {
                Write-Host "✓ Progreso: $($i + 1)/$($sqlCommands.Count) comandos ejecutados" -ForegroundColor Green
            }
        }
        catch {
            $errorCount++
            Write-Host "✗ Error en comando $($i + 1): $($_.Exception.Message)" -ForegroundColor Red
            
            $commandPreview = if ($sqlCommand.Length -gt 100) { $sqlCommand.Substring(0, 100) + "..." } else { $sqlCommand }
            Write-Host "   Comando: $commandPreview" -ForegroundColor Gray
        }
    }
    
    $connection.Close()
    
    Write-Host "`n=== RESUMEN DE EJECUCIÓN ===" -ForegroundColor Cyan
    Write-Host "✓ Comandos exitosos: $successCount" -ForegroundColor Green
    Write-Host "✗ Comandos con error: $errorCount" -ForegroundColor Red
    Write-Host "Total comandos: $($sqlCommands.Count)" -ForegroundColor Cyan
    
    if ($errorCount -eq 0) {
        Write-Host "`n🎉 ¡SCRIPT EJECUTADO EXITOSAMENTE!" -ForegroundColor Green
        Write-Host "Las relaciones de la base de datos PetLove han sido creadas" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Script ejecutado con algunos errores" -ForegroundColor Yellow
        Write-Host "Revisa los errores anteriores para más detalles" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error crítico: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.InnerException) {
        Write-Host "Detalles: $($_.Exception.InnerException)" -ForegroundColor Red
    }
    exit 1
}