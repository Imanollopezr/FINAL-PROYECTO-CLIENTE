USE PetLove;

-- Asegurar usuario Asistente con contraseña en texto plano (asistente123)
IF EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'asistente@petlove.com')
BEGIN
    UPDATE Usuarios SET Clave = 'asistente123', Activo = 1, IdRol = 2 WHERE Correo = 'asistente@petlove.com';
END
ELSE
BEGIN
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Clave, IdRol, Activo, FechaRegistro)
    VALUES ('Asistente', 'Sistema', 'asistente@petlove.com', 'asistente123', 2, 1, GETDATE());
END

-- Asegurar usuario Cliente con contraseña en texto plano (cliente123)
IF EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'cliente@petlove.com')
BEGIN
    UPDATE Usuarios SET Clave = 'cliente123', Activo = 1, IdRol = 4 WHERE Correo = 'cliente@petlove.com';
END
ELSE
BEGIN
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Clave, IdRol, Activo, FechaRegistro)
    VALUES ('Cliente', 'Sistema', 'cliente@petlove.com', 'cliente123', 4, 1, GETDATE());
END

PRINT 'Credenciales en texto plano aplicadas para Asistente y Cliente (se rehashearán al iniciar sesión)';