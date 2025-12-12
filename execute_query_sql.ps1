param(
    [Parameter(Mandatory=$true)]
    [string]$ScriptPath
)

try {
    $serverName = "localhost\SQLEXPRESS01"
    $databaseName = "PetLove"
    
    Write-Host "Ejecutando consulta SQL: $ScriptPath" -ForegroundColor Green
    
    $sqlContent = Get-Content $ScriptPath -Raw
    $sqlContent = $sqlContent -replace "USE PetLove;", ""

    $connectionString = "Server=$serverName;Database=$databaseName;Integrated Security=true;TrustServerCertificate=true;"
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    Write-Host "Conectado a la base de datos" -ForegroundColor Green

    $command = New-Object System.Data.SqlClient.SqlCommand($sqlContent, $connection)
    $command.CommandTimeout = 300

    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($command)
    $dataSet = New-Object System.Data.DataSet
    $adapter.Fill($dataSet) | Out-Null

    if ($dataSet.Tables.Count -gt 0) {
        foreach ($table in $dataSet.Tables) {
            Write-Host "Resultados (" $table.Rows.Count " filas):" -ForegroundColor Cyan
            $table | Format-Table -AutoSize
        }
    } else {
        Write-Host "No se devolvieron filas." -ForegroundColor Yellow
    }

    $connection.Close()
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}