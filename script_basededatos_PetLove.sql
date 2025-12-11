IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [CATEGORIA_PRODUCTO] (
        [IdCategoriaProducto] int NOT NULL IDENTITY,
        [Nombre] nvarchar(50) NOT NULL,
        [Descripcion] nvarchar(200) NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        CONSTRAINT [PK_CATEGORIA_PRODUCTO] PRIMARY KEY ([IdCategoriaProducto])
    );
END;

-- Crear tabla TALLA si no existe (persistencia del módulo de tallas)
IF OBJECT_ID(N'[TALLA]') IS NULL
BEGIN
    CREATE TABLE [TALLA] (
        [IdTalla] int NOT NULL IDENTITY,
        [Nombre] nvarchar(50) NOT NULL,
        [Abreviatura] nvarchar(10) NULL,
        [Descripcion] nvarchar(200) NULL,
        [Activo] bit NOT NULL DEFAULT(1),
        [FechaRegistro] datetime2 NOT NULL DEFAULT(GETDATE()),
        CONSTRAINT [PK_TALLA] PRIMARY KEY ([IdTalla])
    );

    -- Índice único en Nombre para evitar duplicados
    CREATE UNIQUE INDEX [IX_TALLA_Nombre] ON [TALLA]([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [ESTADO] (
        [IdEstado] int NOT NULL IDENTITY,
        [Nombre] nvarchar(50) NOT NULL,
        [Descripcion] nvarchar(200) NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        CONSTRAINT [PK_ESTADO] PRIMARY KEY ([IdEstado])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [MARCA] (
        [IdMarca] int NOT NULL IDENTITY,
        [Nombre] nvarchar(50) NOT NULL,
        [Descripcion] nvarchar(200) NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        CONSTRAINT [PK_MARCA] PRIMARY KEY ([IdMarca])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [MEDIDA] (
        [IdMedida] int NOT NULL IDENTITY,
        [Nombre] nvarchar(50) NOT NULL,
        [Abreviatura] nvarchar(10) NOT NULL,
        [Descripcion] nvarchar(200) NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        CONSTRAINT [PK_MEDIDA] PRIMARY KEY ([IdMedida])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [METODO_PAGO] (
        [IdMetodoPago] int NOT NULL IDENTITY,
        [Nombre] nvarchar(50) NOT NULL,
        [Descripcion] nvarchar(200) NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        CONSTRAINT [PK_METODO_PAGO] PRIMARY KEY ([IdMetodoPago])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [Roles] (
        [Id] int NOT NULL IDENTITY,
        [NombreRol] nvarchar(50) NOT NULL,
        [Descripcion] nvarchar(200) NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [TIPO_DOCUMENTO] (
        [IdTipoDocumento] int NOT NULL IDENTITY,
        [Nombre] nvarchar(50) NOT NULL,
        [Abreviatura] nvarchar(10) NULL,
        [Descripcion] nvarchar(200) NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        CONSTRAINT [PK_TIPO_DOCUMENTO] PRIMARY KEY ([IdTipoDocumento])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [Productos] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        [Descripcion] nvarchar(500) NULL,
        [Precio] decimal(18,2) NOT NULL,
        [Stock] int NOT NULL,
        [IdCategoriaProducto] int NOT NULL,
        [IdMarcaProducto] int NOT NULL,
        [IdMedidaProducto] int NOT NULL,
        [ImagenUrl] nvarchar(200) NULL,
        [Activo] bit NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [FechaActualizacion] datetime2 NULL,
        CONSTRAINT [PK_Productos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Productos_CATEGORIA_PRODUCTO_IdCategoriaProducto] FOREIGN KEY ([IdCategoriaProducto]) REFERENCES [CATEGORIA_PRODUCTO] ([IdCategoriaProducto]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Productos_MARCA_IdMarcaProducto] FOREIGN KEY ([IdMarcaProducto]) REFERENCES [MARCA] ([IdMarca]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Productos_MEDIDA_IdMedidaProducto] FOREIGN KEY ([IdMedidaProducto]) REFERENCES [MEDIDA] ([IdMedida]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [Usuarios] (
        [Id] int NOT NULL IDENTITY,
        [Nombres] nvarchar(100) NOT NULL,
        [Apellidos] nvarchar(100) NOT NULL,
        [Correo] nvarchar(100) NOT NULL,
        [Clave] nvarchar(255) NOT NULL,
        [IdRol] int NOT NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        CONSTRAINT [PK_Usuarios] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Usuarios_Roles_IdRol] FOREIGN KEY ([IdRol]) REFERENCES [Roles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [Clientes] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        [Apellido] nvarchar(100) NOT NULL,
        [Documento] nvarchar(20) NULL,
        [Email] nvarchar(150) NOT NULL,
        [Telefono] nvarchar(20) NULL,
        [Direccion] nvarchar(200) NULL,
        [Ciudad] nvarchar(50) NULL,
        [CodigoPostal] nvarchar(10) NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        [FechaActualizacion] datetime2 NULL,
        [TipoDocumentoIdTipoDocumento] int NULL,
        CONSTRAINT [PK_Clientes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Clientes_TIPO_DOCUMENTO_TipoDocumentoIdTipoDocumento] FOREIGN KEY ([TipoDocumentoIdTipoDocumento]) REFERENCES [TIPO_DOCUMENTO] ([IdTipoDocumento]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [Proveedores] (
        [Id] int NOT NULL IDENTITY,
        [TipoPersona] nvarchar(20) NOT NULL,
        [Nombre] nvarchar(100) NOT NULL,
        [Documento] nvarchar(50) NOT NULL,
        [Email] nvarchar(150) NOT NULL,
        [Celular] nvarchar(20) NULL,
        [Telefono] nvarchar(20) NULL,
        [Direccion] nvarchar(200) NULL,
        [Ciudad] nvarchar(50) NULL,
        [Nombres] nvarchar(100) NULL,
        [Apellidos] nvarchar(100) NULL,
        [RazonSocial] nvarchar(200) NULL,
        [RepresentanteLegal] nvarchar(200) NULL,
        [NIT] nvarchar(50) NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        [FechaActualizacion] datetime2 NULL,
        [TipoDocumentoIdTipoDocumento] int NULL,
        CONSTRAINT [PK_Proveedores] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Proveedores_TIPO_DOCUMENTO_TipoDocumentoIdTipoDocumento] FOREIGN KEY ([TipoDocumentoIdTipoDocumento]) REFERENCES [TIPO_DOCUMENTO] ([IdTipoDocumento]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [PasswordResetTokens] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(6) NOT NULL,
        [UserId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [IsUsed] bit NOT NULL,
        [DireccionIP] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PasswordResetTokens_Usuarios_UserId] FOREIGN KEY ([UserId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] int NOT NULL IDENTITY,
        [Token] nvarchar(255) NOT NULL,
        [UsuarioId] int NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [FechaExpiracion] datetime2 NOT NULL,
        [Usado] bit NOT NULL,
        [Revocado] bit NOT NULL,
        [ReemplazadoPor] nvarchar(255) NULL,
        [RazonRevocacion] nvarchar(500) NULL,
        [DireccionIP] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [Pedidos] (
        [Id] int NOT NULL IDENTITY,
        [ClienteId] int NOT NULL,
        [FechaPedido] datetime2 NOT NULL,
        [FechaEntrega] datetime2 NULL,
        [Estado] nvarchar(20) NOT NULL,
        [Subtotal] decimal(18,2) NOT NULL,
        [CostoEnvio] decimal(18,2) NOT NULL,
        [Impuestos] decimal(18,2) NOT NULL,
        [Total] decimal(18,2) NOT NULL,
        [DireccionEntrega] nvarchar(200) NULL,
        [CiudadEntrega] nvarchar(50) NULL,
        [CodigoPostalEntrega] nvarchar(10) NULL,
        [TelefonoContacto] nvarchar(20) NULL,
        [Observaciones] nvarchar(500) NULL,
        [NumeroSeguimiento] nvarchar(50) NULL,
        [FechaActualizacion] datetime2 NULL,
        [EstadoIdEstado] int NULL,
        CONSTRAINT [PK_Pedidos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Pedidos_Clientes_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Clientes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Pedidos_ESTADO_EstadoIdEstado] FOREIGN KEY ([EstadoIdEstado]) REFERENCES [ESTADO] ([IdEstado])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [Ventas] (
        [Id] int NOT NULL IDENTITY,
        [ClienteId] int NOT NULL,
        [FechaVenta] datetime2 NOT NULL,
        [Subtotal] decimal(18,2) NOT NULL,
        [Impuestos] decimal(18,2) NOT NULL,
        [Total] decimal(18,2) NOT NULL,
        [NumeroFactura] nvarchar(20) NULL,
        [MetodoPago] nvarchar(50) NOT NULL,
        [Estado] nvarchar(20) NOT NULL,
        [Observaciones] nvarchar(500) NULL,
        [FechaActualizacion] datetime2 NULL,
        [EstadoIdEstado] int NULL,
        [MetodoPagoIdMetodoPago] int NULL,
        CONSTRAINT [PK_Ventas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Ventas_Clientes_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Clientes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Ventas_ESTADO_EstadoIdEstado] FOREIGN KEY ([EstadoIdEstado]) REFERENCES [ESTADO] ([IdEstado]),
        CONSTRAINT [FK_Ventas_METODO_PAGO_MetodoPagoIdMetodoPago] FOREIGN KEY ([MetodoPagoIdMetodoPago]) REFERENCES [METODO_PAGO] ([IdMetodoPago])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [Compras] (
        [Id] int NOT NULL IDENTITY,
        [ProveedorId] int NOT NULL,
        [FechaCompra] datetime2 NOT NULL,
        [Subtotal] decimal(18,2) NOT NULL,
        [Impuestos] decimal(18,2) NOT NULL,
        [Total] decimal(18,2) NOT NULL,
        [NumeroFactura] nvarchar(20) NULL,
        [Estado] nvarchar(20) NOT NULL,
        [Observaciones] nvarchar(500) NULL,
        [FechaRecepcion] datetime2 NULL,
        [FechaActualizacion] datetime2 NULL,
        [EstadoIdEstado] int NULL,
        [MetodoPagoIdMetodoPago] int NULL,
        CONSTRAINT [PK_Compras] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Compras_ESTADO_EstadoIdEstado] FOREIGN KEY ([EstadoIdEstado]) REFERENCES [ESTADO] ([IdEstado]),
        CONSTRAINT [FK_Compras_METODO_PAGO_MetodoPagoIdMetodoPago] FOREIGN KEY ([MetodoPagoIdMetodoPago]) REFERENCES [METODO_PAGO] ([IdMetodoPago]),
        CONSTRAINT [FK_Compras_Proveedores_ProveedorId] FOREIGN KEY ([ProveedorId]) REFERENCES [Proveedores] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [ProductoProveedores] (
        [Id] int NOT NULL IDENTITY,
        [ProductoId] int NOT NULL,
        [ProveedorId] int NOT NULL,
        [PrecioCompra] decimal(18,2) NOT NULL,
        [CodigoProveedor] nvarchar(50) NULL,
        [TiempoEntregaDias] int NOT NULL,
        [CantidadMinima] int NOT NULL,
        [EsProveedorPrincipal] bit NOT NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        [FechaActualizacion] datetime2 NULL,
        CONSTRAINT [PK_ProductoProveedores] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProductoProveedores_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProductoProveedores_Proveedores_ProveedorId] FOREIGN KEY ([ProveedorId]) REFERENCES [Proveedores] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [DetallesPedido] (
        [Id] int NOT NULL IDENTITY,
        [PedidoId] int NOT NULL,
        [ProductoId] int NOT NULL,
        [Cantidad] int NOT NULL,
        [PrecioUnitario] decimal(18,2) NOT NULL,
        [Descuento] decimal(18,2) NOT NULL,
        [Subtotal] decimal(18,2) NOT NULL,
        CONSTRAINT [PK_DetallesPedido] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DetallesPedido_Pedidos_PedidoId] FOREIGN KEY ([PedidoId]) REFERENCES [Pedidos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_DetallesPedido_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [DetallesVenta] (
        [Id] int NOT NULL IDENTITY,
        [VentaId] int NOT NULL,
        [ProductoId] int NOT NULL,
        [Cantidad] int NOT NULL,
        [PrecioUnitario] decimal(18,2) NOT NULL,
        [Descuento] decimal(18,2) NOT NULL,
        [Subtotal] decimal(18,2) NOT NULL,
        CONSTRAINT [PK_DetallesVenta] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DetallesVenta_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_DetallesVenta_Ventas_VentaId] FOREIGN KEY ([VentaId]) REFERENCES [Ventas] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE TABLE [DetalleCompra] (
        [Id] int NOT NULL IDENTITY,
        [CompraId] int NOT NULL,
        [ProductoId] int NOT NULL,
        [Cantidad] int NOT NULL,
        [PrecioUnitario] decimal(18,2) NOT NULL,
        [Subtotal] decimal(18,2) NOT NULL,
        CONSTRAINT [PK_DetalleCompra] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DetalleCompra_Compras_CompraId] FOREIGN KEY ([CompraId]) REFERENCES [Compras] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_DetalleCompra_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CATEGORIA_PRODUCTO_Nombre] ON [CATEGORIA_PRODUCTO] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Clientes_Documento] ON [Clientes] ([Documento]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Clientes_Email] ON [Clientes] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Clientes_TipoDocumentoIdTipoDocumento] ON [Clientes] ([TipoDocumentoIdTipoDocumento]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Compras_EstadoIdEstado] ON [Compras] ([EstadoIdEstado]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Compras_MetodoPagoIdMetodoPago] ON [Compras] ([MetodoPagoIdMetodoPago]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Compras_ProveedorId] ON [Compras] ([ProveedorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DetalleCompra_CompraId] ON [DetalleCompra] ([CompraId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DetalleCompra_ProductoId] ON [DetalleCompra] ([ProductoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DetallesPedido_PedidoId] ON [DetallesPedido] ([PedidoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DetallesPedido_ProductoId] ON [DetallesPedido] ([ProductoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DetallesVenta_ProductoId] ON [DetallesVenta] ([ProductoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DetallesVenta_VentaId] ON [DetallesVenta] ([VentaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ESTADO_Nombre] ON [ESTADO] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MARCA_Nombre] ON [MARCA] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MEDIDA_Nombre] ON [MEDIDA] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_METODO_PAGO_Nombre] ON [METODO_PAGO] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PasswordResetTokens_Codigo] ON [PasswordResetTokens] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PasswordResetTokens_UserId] ON [PasswordResetTokens] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Pedidos_ClienteId] ON [Pedidos] ([ClienteId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Pedidos_EstadoIdEstado] ON [Pedidos] ([EstadoIdEstado]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ProductoProveedores_ProductoId_ProveedorId] ON [ProductoProveedores] ([ProductoId], [ProveedorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ProductoProveedores_ProveedorId] ON [ProductoProveedores] ([ProveedorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Productos_IdCategoriaProducto] ON [Productos] ([IdCategoriaProducto]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Productos_IdMarcaProducto] ON [Productos] ([IdMarcaProducto]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Productos_IdMedidaProducto] ON [Productos] ([IdMedidaProducto]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Productos_Nombre] ON [Productos] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Proveedores_Activo] ON [Proveedores] ([Activo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Proveedores_Nombre] ON [Proveedores] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Proveedores_TipoDocumentoIdTipoDocumento] ON [Proveedores] ([TipoDocumentoIdTipoDocumento]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_Token] ON [RefreshTokens] ([Token]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UsuarioId] ON [RefreshTokens] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Roles_NombreRol] ON [Roles] ([NombreRol]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TIPO_DOCUMENTO_Nombre] ON [TIPO_DOCUMENTO] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Usuarios_Correo] ON [Usuarios] ([Correo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Usuarios_IdRol] ON [Usuarios] ([IdRol]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Ventas_ClienteId] ON [Ventas] ([ClienteId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Ventas_EstadoIdEstado] ON [Ventas] ([EstadoIdEstado]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Ventas_MetodoPagoIdMetodoPago] ON [Ventas] ([MetodoPagoIdMetodoPago]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250924003614_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250924003614_InitialCreate', N'9.0.9');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250929215148_AddCarritoTables'
)
BEGIN
    CREATE TABLE [Carritos] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [FechaActualizacion] datetime2 NULL,
        [Activo] bit NOT NULL,
        CONSTRAINT [PK_Carritos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Carritos_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250929215148_AddCarritoTables'
)
BEGIN
    CREATE TABLE [CarritoItems] (
        [Id] int NOT NULL IDENTITY,
        [CarritoId] int NOT NULL,
        [ProductoId] int NOT NULL,
        [Cantidad] int NOT NULL,
        [PrecioUnitario] decimal(18,2) NOT NULL,
        [FechaAgregado] datetime2 NOT NULL,
        [FechaActualizacion] datetime2 NULL,
        CONSTRAINT [PK_CarritoItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CarritoItems_Carritos_CarritoId] FOREIGN KEY ([CarritoId]) REFERENCES [Carritos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CarritoItems_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250929215148_AddCarritoTables'
)
BEGIN
    CREATE INDEX [IX_CarritoItems_CarritoId] ON [CarritoItems] ([CarritoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250929215148_AddCarritoTables'
)
BEGIN
    CREATE INDEX [IX_CarritoItems_ProductoId] ON [CarritoItems] ([ProductoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250929215148_AddCarritoTables'
)
BEGIN
    CREATE INDEX [IX_Carritos_UsuarioId] ON [Carritos] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250929215148_AddCarritoTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250929215148_AddCarritoTables', N'9.0.9');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251001175313_UpdateDatabase'
)
BEGIN
    ALTER TABLE [DetalleCompra] ADD [GananciaCalculada] decimal(18,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251001175313_UpdateDatabase'
)
BEGIN
    ALTER TABLE [DetalleCompra] ADD [PorcentajeGanancia] decimal(5,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251001175313_UpdateDatabase'
)
BEGIN
    ALTER TABLE [Compras] ADD [GananciaCalculada] decimal(18,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251001175313_UpdateDatabase'
)
BEGIN
    ALTER TABLE [Compras] ADD [PorcentajeGanancia] decimal(5,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251001175313_UpdateDatabase'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251001175313_UpdateDatabase', N'9.0.9');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN

    IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'GananciaCalculada' AND Object_ID = Object_ID(N'[dbo].[DetalleCompra]'))
    BEGIN
        ALTER TABLE [dbo].[DetalleCompra] DROP COLUMN [GananciaCalculada];
    END

END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN

    IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'PorcentajeGanancia' AND Object_ID = Object_ID(N'[dbo].[DetalleCompra]'))
    BEGIN
        ALTER TABLE [dbo].[DetalleCompra] DROP COLUMN [PorcentajeGanancia];
    END

END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN

    IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'GananciaCalculada' AND Object_ID = Object_ID(N'[dbo].[Compras]'))
    BEGIN
        ALTER TABLE [dbo].[Compras] DROP COLUMN [GananciaCalculada];
    END

END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN

    IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'PorcentajeGanancia' AND Object_ID = Object_ID(N'[dbo].[Compras]'))
    BEGIN
        ALTER TABLE [dbo].[Compras] DROP COLUMN [PorcentajeGanancia];
    END

END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN
    CREATE TABLE [PERMISO] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        [Descripcion] nvarchar(250) NOT NULL,
        [Activo] bit NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        CONSTRAINT [PK_PERMISO] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN
    CREATE TABLE [PERMISO_ROL] (
        [Id] int NOT NULL IDENTITY,
        [RolId] int NOT NULL,
        [PermisoId] int NOT NULL,
        CONSTRAINT [PK_PERMISO_ROL] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PERMISO_ROL_PERMISO_PermisoId] FOREIGN KEY ([PermisoId]) REFERENCES [PERMISO] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PERMISO_ROL_Roles_RolId] FOREIGN KEY ([RolId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PERMISO_Nombre] ON [PERMISO] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN
    CREATE INDEX [IX_PERMISO_ROL_PermisoId] ON [PERMISO_ROL] ([PermisoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PERMISO_ROL_RolId_PermisoId] ON [PERMISO_ROL] ([RolId], [PermisoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004231240_AddPermissionsTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251004231240_AddPermissionsTables', N'9.0.9');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251007051049_AddPorcentajeGananciaPrecision'
)
BEGIN
    ALTER TABLE [Compras] ADD [PorcentajeGanancia] decimal(18,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251007051049_AddPorcentajeGananciaPrecision'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251007051049_AddPorcentajeGananciaPrecision', N'9.0.9');
END;

COMMIT;
GO

