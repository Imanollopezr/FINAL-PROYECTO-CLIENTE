-- Crear tabla PERMISO si no existe
IF NOT EXISTS (
    SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PERMISO]') AND type = N'U'
)
BEGIN
    CREATE TABLE [dbo].[PERMISO](
        [Id] INT IDENTITY(1,1) NOT NULL,
        [Nombre] NVARCHAR(100) NOT NULL,
        [Descripcion] NVARCHAR(250) NOT NULL,
        [Activo] BIT NOT NULL CONSTRAINT [DF_PERMISO_Activo] DEFAULT(1),
        [FechaRegistro] DATETIME2 NOT NULL CONSTRAINT [DF_PERMISO_FechaRegistro] DEFAULT(SYSDATETIME()),
        CONSTRAINT [PK_PERMISO] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END

-- Índice único en PERMISO.Nombre
IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = N'IX_PERMISO_Nombre' AND object_id = OBJECT_ID(N'[dbo].[PERMISO]')
)
BEGIN
    CREATE UNIQUE INDEX [IX_PERMISO_Nombre] ON [dbo].[PERMISO]([Nombre]);
END

-- Crear tabla PERMISO_ROL si no existe
IF NOT EXISTS (
    SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PERMISO_ROL]') AND type = N'U'
)
BEGIN
    CREATE TABLE [dbo].[PERMISO_ROL](
        [Id] INT IDENTITY(1,1) NOT NULL,
        [RolId] INT NOT NULL,
        [PermisoId] INT NOT NULL,
        CONSTRAINT [PK_PERMISO_ROL] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_PERMISO_ROL_Roles_RolId] FOREIGN KEY ([RolId]) REFERENCES [dbo].[Roles]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PERMISO_ROL_PERMISO_PermisoId] FOREIGN KEY ([PermisoId]) REFERENCES [dbo].[PERMISO]([Id]) ON DELETE CASCADE
    );
END

-- Índice único en combinación RolId, PermisoId
IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = N'IX_PERMISO_ROL_RolId_PermisoId' AND object_id = OBJECT_ID(N'[dbo].[PERMISO_ROL]')
)
BEGIN
    CREATE UNIQUE INDEX [IX_PERMISO_ROL_RolId_PermisoId] ON [dbo].[PERMISO_ROL]([RolId], [PermisoId]);
END

-- Registrar la migración AddPermissionsTables como aplicada
IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = '20251004231240_AddPermissionsTables')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20251004231240_AddPermissionsTables', '9.0.9');
END