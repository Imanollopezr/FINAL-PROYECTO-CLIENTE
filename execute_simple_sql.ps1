param(
    [Parameter(Mandatory=$true)]
    [string]$ScriptPath
)

try {
    $serverName = "localhost\SQLEXPRESS01"
    $databaseName = "PetLove"
    
    Write-Host "Ejecutando script SQL: $ScriptPath" -ForegroundColor Green
    
    # Leer el contenido del archivo SQL
    $sqlContent = Get-Content $ScriptPath -Raw
    
    # Crear conexión
    $connectionString = "Server=$serverName;Database=$databaseName;Integrated Security=true;TrustServerCertificate=true;"
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    
    $connection.Open()
    Write-Host "Conectado a la base de datos" -ForegroundColor Green
    
    # Ejecutar el script
    $command = New-Object System.Data.SqlClient.SqlCommand($sqlContent, $connection)
    $command.CommandTimeout = 300
    $result = $command.ExecuteNonQuery()
    
    Write-Host "Script ejecutado exitosamente" -ForegroundColor Green
    
    $connection.Close()
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}