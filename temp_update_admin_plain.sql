-- Actualiza/crea el usuario admin con contraseña en texto plano y activo

IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'admin@petlove.com')
BEGIN
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Clave, IdRol, Activo, FechaRegistro)
    VALUES ('Admin', 'Sistema', 'admin@petlove.com', 'admin123', 1, 1, GETDATE());
END
ELSE
BEGIN
    UPDATE Usuarios 
    SET Clave = 'admin123', Activo = 1, IdRol = ISNULL(IdRol, 1)
    WHERE Correo = 'admin@petlove.com';
END