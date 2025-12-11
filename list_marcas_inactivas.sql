-- Listar marcas inactivas actuales
SELECT IdMarca, Nombre, Descripcion, Activo, FechaRegistro
FROM MARCA
WHERE Activo = 0
ORDER BY IdMarca;