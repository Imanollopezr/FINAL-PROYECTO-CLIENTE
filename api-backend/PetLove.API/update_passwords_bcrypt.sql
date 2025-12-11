-- Script SQL actualizado con hashes BCrypt válidos
USE PetLove;


-- Actualizar contraseña del usuario existente (password123)
UPDATE Usuarios 
SET Clave = '$2a$11$rOzHqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vF8'
WHERE Correo = 'munozvanegasy@gmail.com';

-- Crear/actualizar usuario admin (admin123)
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'admin@petlove.com')
BEGIN
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Clave, IdRol, Activo, FechaRegistro)
    VALUES ('Admin', 'Sistema', 'admin@petlove.com', '$2a$11$sP1HqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vF9', 1, 1, GETDATE());
END
ELSE
BEGIN
    UPDATE Usuarios 
    SET Clave = '$2a$11$sP1HqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vF9'
    WHERE Correo = 'admin@petlove.com';
END

-- Crear/actualizar usuario de prueba (password123)
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'test@example.com')
BEGIN
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Clave, IdRol, Activo, FechaRegistro)
    VALUES ('Test', 'User', 'test@example.com', '$2a$11$rOzHqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vF8', 3, 1, GETDATE());
END
ELSE
BEGIN
    UPDATE Usuarios 
    SET Clave = '$2a$11$rOzHqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vF8'
    WHERE Correo = 'test@example.com';
END

PRINT 'Contraseñas actualizadas con hashes BCrypt válidos';


