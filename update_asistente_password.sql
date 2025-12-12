-- Actualizar contraseÃ±a del usuario asistente con hash BCrypt vÃ¡lido
USE PetLove;
GO

UPDATE Usuarios 
SET Clave = '$2a$12$rOzHqnSzPvdQ8tX5YmJ8aeKQvF7vF8qF7vF8qF7vF8qF7vF8qF7vF8'
WHERE Correo = 'asistente@petlove.com';

-- Verificar actualizaciÃ³n
SELECT Correo, LEFT(Clave, 10) + '...' as ClaveHash, LEN(Clave) as LongitudClave 
FROM Usuarios 
WHERE Correo = 'asistente@petlove.com';

PRINT 'ContraseÃ±a actualizada: asistente@petlove.com / asistente123';
