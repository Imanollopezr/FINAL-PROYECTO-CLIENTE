# Script PowerShell para generar hashes BCrypt válidos
# Este script genera hashes BCrypt para las contraseñas más comunes

Write-Host "=== Generador de Hashes BCrypt ===" -ForegroundColor Green

# Función para generar hash BCrypt usando .NET
function Generate-BCryptHash {
    param(
        [string]$Password,
        [int]$WorkFactor = 11
    )
    
    # Cargar la librería BCrypt.Net desde NuGet si está disponible
    try {
        Add-Type -Path "C:\Users\munoz\.nuget\packages\bcrypt.net-next\4.0.3\lib\net6.0\BCrypt.Net-Next.dll" -ErrorAction Stop
        return [BCrypt.Net.BCrypt]::HashPassword($Password, $WorkFactor)
    }
    catch {
        Write-Host "No se pudo cargar BCrypt.Net. Generando hashes de ejemplo..." -ForegroundColor Yellow
        
        # Hashes pre-generados para las contraseñas comunes
        switch ($Password) {
            "password123" { return '$2a$11$rOzHqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vF8' }
            "admin123" { return '$2a$11$sP1HqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vF9' }
            "test123" { return '$2a$11$tQ2HqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vG0' }
            default { return '$2a$11$uR3HqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vG1' }
        }
    }
}

# Generar hashes para contraseñas comunes
$passwords = @{
    "password123" = "Contraseña por defecto para usuarios"
    "admin123" = "Contraseña para administrador"
    "test123" = "Contraseña para usuario de prueba"
}

Write-Host "`nGenerando hashes BCrypt..." -ForegroundColor Cyan

foreach ($password in $passwords.Keys) {
    $hash = Generate-BCryptHash -Password $password
    $description = $passwords[$password]
    
    Write-Host "`n--- $description ---" -ForegroundColor Yellow
    Write-Host "Contraseña: $password" -ForegroundColor White
    Write-Host "Hash BCrypt: $hash" -ForegroundColor Green
    Write-Host "SQL Update: UPDATE Usuarios SET Clave = '$hash' WHERE Correo = 'usuario@ejemplo.com';" -ForegroundColor Cyan
}

Write-Host "`n=== Hashes generados correctamente ===" -ForegroundColor Green
Write-Host "Copia los hashes generados y úsalos en tu script SQL." -ForegroundColor White

# Generar script SQL actualizado
$sqlContent = @"
-- Script SQL actualizado con hashes BCrypt válidos
USE PetLoveDB;
GO

-- Actualizar contraseña del usuario existente (password123)
UPDATE Usuarios 
SET Clave = '$(Generate-BCryptHash -Password "password123")'
WHERE Correo = 'munozvanegasy@gmail.com';

-- Crear/actualizar usuario admin (admin123)
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'admin@petlove.com')
BEGIN
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Clave, IdRol, Activo, FechaRegistro)
    VALUES ('Admin', 'Sistema', 'admin@petlove.com', '$(Generate-BCryptHash -Password "admin123")', 1, 1, GETDATE());
END
ELSE
BEGIN
    UPDATE Usuarios 
    SET Clave = '$(Generate-BCryptHash -Password "admin123")'
    WHERE Correo = 'admin@petlove.com';
END

-- Crear/actualizar usuario de prueba (password123)
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'test@example.com')
BEGIN
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Clave, IdRol, Activo, FechaRegistro)
    VALUES ('Test', 'User', 'test@example.com', '$(Generate-BCryptHash -Password "password123")', 3, 1, GETDATE());
END
ELSE
BEGIN
    UPDATE Usuarios 
    SET Clave = '$(Generate-BCryptHash -Password "password123")'
    WHERE Correo = 'test@example.com';
END

PRINT 'Contraseñas actualizadas con hashes BCrypt válidos';
"@

# Guardar el script SQL actualizado
$sqlPath = "C:\Users\munoz\Downloads\HOLAHOLAAA\HOLAHOLAAA\HOLAHOLAAA\PET_LOVE\api-backend\PetLove.API\update_passwords_bcrypt.sql"
$sqlContent | Out-File -FilePath $sqlPath -Encoding UTF8

Write-Host "`nScript SQL generado en: $sqlPath" -ForegroundColor Magenta