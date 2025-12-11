USE PetLove;

-- Asegurar usuario admin con contraseña en texto plano (admin123)
IF EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'admin@petlove.com')
BEGIN
    UPDATE Usuarios SET Clave = 'admin123', Activo = 1, IdRol = 1 WHERE Correo = 'admin@petlove.com';
END
ELSE
BEGIN
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Clave, IdRol, Activo, FechaRegistro)
    VALUES ('Admin', 'Sistema', 'admin@petlove.com', 'admin123', 1, 1, GETDATE());
END

-- Asegurar usuario de prueba con contraseña en texto plano (password123)
IF EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'test@example.com')
BEGIN
    UPDATE Usuarios SET Clave = 'password123', Activo = 1, IdRol = 3 WHERE Correo = 'test@example.com';
END
ELSE
BEGIN
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Clave, IdRol, Activo, FechaRegistro)
    VALUES ('Test', 'User', 'test@example.com', 'password123', 3, 1, GETDATE());
END

-- Opcional: actualizar usuario del asistente si existe
IF EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'munozvanegasy@gmail.com')
BEGIN
    UPDATE Usuarios SET Clave = 'password123', Activo = 1 WHERE Correo = 'munozvanegasy@gmail.com';
END

PRINT 'Contraseñas en texto plano aplicadas para admin y test (se rehashearán al iniciar sesión)';