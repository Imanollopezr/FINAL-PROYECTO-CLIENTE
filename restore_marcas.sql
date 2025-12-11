BEGIN TRAN;

-- Restaurar todas las marcas inactivas
UPDATE MARCA
SET Activo = 1
WHERE Activo = 0;

COMMIT;