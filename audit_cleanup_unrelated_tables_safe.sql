USE PetLove;

PRINT '=== Auditoría y limpieza de tablas no relacionadas ===';

-- 1) Backup de la base de datos antes de eliminar
DECLARE @backupDir NVARCHAR(4000) = CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS NVARCHAR(4000));
IF @backupDir IS NULL OR LTRIM(RTRIM(@backupDir)) = ''
    SET @backupDir = 'C:\\Backup';

DECLARE @timestamp NVARCHAR(30) = CONVERT(NVARCHAR(20), GETDATE(), 112) + '_' + REPLACE(CONVERT(NVARCHAR(8), GETDATE(), 108), ':', '');
DECLARE @backupPath NVARCHAR(4000) = @backupDir + '\\PetLove_backup_' + @timestamp + '.bak';

BEGIN TRY
    BACKUP DATABASE [PetLove]
        TO DISK = @backupPath
        WITH COPY_ONLY, INIT, STATS = 5; -- sin COMPRESSION por SQL Express
    PRINT 'Backup creado en: ' + @backupPath;
END TRY
BEGIN CATCH
    PRINT 'ERROR al crear backup: ' + ERROR_MESSAGE();
    THROW; -- Detener ejecución si no hay backup
END CATCH

-- 2) Tabla temporal con la lista de tablas esperadas por el proyecto
IF OBJECT_ID('tempdb..#ExpectedTables') IS NOT NULL DROP TABLE #ExpectedTables;
CREATE TABLE #ExpectedTables (
    TableName SYSNAME,
    SchemaName SYSNAME DEFAULT 'dbo'
);

INSERT INTO #ExpectedTables (TableName) VALUES
    ('Productos'),
    ('Clientes'),
    ('Proveedores'),
    ('ProductoProveedores'),
    ('Ventas'),
    ('DetallesVenta'),
    ('Compras'),
    ('DetalleCompra'),
    ('Pedidos'),
    ('DetallesPedido'),
    ('CATEGORIA_PRODUCTO'),
    ('MARCA'),
    ('MEDIDA'),
    ('TIPO_DOCUMENTO'),
    ('METODO_PAGO'),
    ('ESTADO'),
    ('Roles'),
    ('Usuarios'),
    ('RefreshTokens'),
    ('PasswordResetTokens'),
    ('PERMISO'),
    ('PERMISO_ROL'),
    ('Carritos'),
    ('CarritoItems');

-- 3) Listar todas las tablas actuales y las extra no esperadas
IF OBJECT_ID('tempdb..#AllTables') IS NOT NULL DROP TABLE #AllTables;
CREATE TABLE #AllTables (
    TableName SYSNAME,
    SchemaName SYSNAME
);

INSERT INTO #AllTables(TableName, SchemaName)
SELECT t.name, s.name
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id;

PRINT '=== Listado de tablas presentes en la BD ===';
SELECT * FROM #AllTables ORDER BY SchemaName, TableName;

PRINT '=== Tablas NO relacionadas (no están en la lista del proyecto) ===';
IF OBJECT_ID('tempdb..#ExtraTables') IS NOT NULL DROP TABLE #ExtraTables;
CREATE TABLE #ExtraTables (
    TableName SYSNAME,
    SchemaName SYSNAME
);

INSERT INTO #ExtraTables(TableName, SchemaName)
SELECT a.TableName, a.SchemaName
FROM #AllTables a
LEFT JOIN #ExpectedTables e
    ON a.TableName = e.TableName
   AND a.SchemaName = ISNULL(e.SchemaName, 'dbo')
WHERE e.TableName IS NULL;

SELECT * FROM #ExtraTables ORDER BY SchemaName, TableName;

-- Si no hay extra, salir
IF NOT EXISTS (SELECT 1 FROM #ExtraTables)
BEGIN
    PRINT 'No se encontraron tablas extra. No hay nada que limpiar.';
    RETURN;
END

-- 4) Eliminar FKs que referencien tablas extra para permitir DROP TABLE
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql = STRING_AGG(
    'ALTER TABLE [' + sch.name + '].[' + tab.name + '] DROP CONSTRAINT [' + fk.name + '];',
    CHAR(13) + CHAR(10)
)
FROM sys.foreign_keys fk
JOIN sys.tables tab ON tab.object_id = fk.parent_object_id
JOIN sys.schemas sch ON sch.schema_id = tab.schema_id
JOIN sys.tables refTab ON refTab.object_id = fk.referenced_object_id
JOIN sys.schemas refSch ON refSch.schema_id = refTab.schema_id
JOIN #ExtraTables et ON et.TableName = refTab.name AND et.SchemaName = refSch.name;

IF @sql IS NOT NULL AND LEN(@sql) > 0
BEGIN
    PRINT 'Eliminando llaves foráneas que referencian tablas extra...';
    EXEC sp_executesql @sql;
END
ELSE
BEGIN
    PRINT 'No se encontraron llaves foráneas hacia tablas extra.';
END

-- 5) Eliminar las tablas extra
DECLARE @dropSql NVARCHAR(MAX) = N'';
SELECT @dropSql = STRING_AGG('DROP TABLE [' + SchemaName + '].[' + TableName + '];', CHAR(13) + CHAR(10))
FROM #ExtraTables;

PRINT 'Eliminando tablas extra...';
EXEC sp_executesql @dropSql;

PRINT 'Limpieza completada. Tablas restantes:';
SELECT s.name AS SchemaName, t.name AS TableName
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
ORDER BY s.name, t.name;