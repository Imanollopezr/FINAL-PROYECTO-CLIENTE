using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetLove.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CATEGORIA_PRODUCTO",
                columns: table => new
                {
                    IdCategoriaProducto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CATEGORIA_PRODUCTO", x => x.IdCategoriaProducto);
                });

            migrationBuilder.CreateTable(
                name: "ESTADO",
                columns: table => new
                {
                    IdEstado = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ESTADO", x => x.IdEstado);
                });

            migrationBuilder.CreateTable(
                name: "MARCA",
                columns: table => new
                {
                    IdMarca = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MARCA", x => x.IdMarca);
                });

            migrationBuilder.CreateTable(
                name: "MEDIDA",
                columns: table => new
                {
                    IdMedida = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Abreviatura = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MEDIDA", x => x.IdMedida);
                });

            migrationBuilder.CreateTable(
                name: "METODO_PAGO",
                columns: table => new
                {
                    IdMetodoPago = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_METODO_PAGO", x => x.IdMetodoPago);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreRol = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TIPO_DOCUMENTO",
                columns: table => new
                {
                    IdTipoDocumento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Abreviatura = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TIPO_DOCUMENTO", x => x.IdTipoDocumento);
                });

            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Stock = table.Column<int>(type: "int", nullable: false),
                    IdCategoriaProducto = table.Column<int>(type: "int", nullable: false),
                    IdMarcaProducto = table.Column<int>(type: "int", nullable: false),
                    IdMedidaProducto = table.Column<int>(type: "int", nullable: false),
                    ImagenUrl = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Productos_CATEGORIA_PRODUCTO_IdCategoriaProducto",
                        column: x => x.IdCategoriaProducto,
                        principalTable: "CATEGORIA_PRODUCTO",
                        principalColumn: "IdCategoriaProducto",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Productos_MARCA_IdMarcaProducto",
                        column: x => x.IdMarcaProducto,
                        principalTable: "MARCA",
                        principalColumn: "IdMarca",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Productos_MEDIDA_IdMedidaProducto",
                        column: x => x.IdMedidaProducto,
                        principalTable: "MEDIDA",
                        principalColumn: "IdMedida",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombres = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Apellidos = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Correo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Clave = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IdRol = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_Roles_IdRol",
                        column: x => x.IdRol,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Apellido = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Documento = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Direccion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Ciudad = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CodigoPostal = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TipoDocumentoIdTipoDocumento = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clientes_TIPO_DOCUMENTO_TipoDocumentoIdTipoDocumento",
                        column: x => x.TipoDocumentoIdTipoDocumento,
                        principalTable: "TIPO_DOCUMENTO",
                        principalColumn: "IdTipoDocumento",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Proveedores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TipoPersona = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Documento = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Celular = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Direccion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Ciudad = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Nombres = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Apellidos = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RazonSocial = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    RepresentanteLegal = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    NIT = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TipoDocumentoIdTipoDocumento = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proveedores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Proveedores_TIPO_DOCUMENTO_TipoDocumentoIdTipoDocumento",
                        column: x => x.TipoDocumentoIdTipoDocumento,
                        principalTable: "TIPO_DOCUMENTO",
                        principalColumn: "IdTipoDocumento",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PasswordResetTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false),
                    DireccionIP = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordResetTokens_Usuarios_UserId",
                        column: x => x.UserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Token = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaExpiracion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Usado = table.Column<bool>(type: "bit", nullable: false),
                    Revocado = table.Column<bool>(type: "bit", nullable: false),
                    ReemplazadoPor = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    RazonRevocacion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DireccionIP = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Pedidos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    FechaPedido = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEntrega = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CostoEnvio = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Impuestos = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DireccionEntrega = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CiudadEntrega = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CodigoPostalEntrega = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    TelefonoContacto = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Observaciones = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    NumeroSeguimiento = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EstadoIdEstado = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pedidos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pedidos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pedidos_ESTADO_EstadoIdEstado",
                        column: x => x.EstadoIdEstado,
                        principalTable: "ESTADO",
                        principalColumn: "IdEstado");
                });

            migrationBuilder.CreateTable(
                name: "Ventas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    FechaVenta = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Impuestos = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    NumeroFactura = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    MetodoPago = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EstadoIdEstado = table.Column<int>(type: "int", nullable: true),
                    MetodoPagoIdMetodoPago = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ventas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ventas_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ventas_ESTADO_EstadoIdEstado",
                        column: x => x.EstadoIdEstado,
                        principalTable: "ESTADO",
                        principalColumn: "IdEstado");
                    table.ForeignKey(
                        name: "FK_Ventas_METODO_PAGO_MetodoPagoIdMetodoPago",
                        column: x => x.MetodoPagoIdMetodoPago,
                        principalTable: "METODO_PAGO",
                        principalColumn: "IdMetodoPago");
                });

            migrationBuilder.CreateTable(
                name: "Compras",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProveedorId = table.Column<int>(type: "int", nullable: false),
                    FechaCompra = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Impuestos = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    NumeroFactura = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaRecepcion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EstadoIdEstado = table.Column<int>(type: "int", nullable: true),
                    MetodoPagoIdMetodoPago = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Compras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Compras_ESTADO_EstadoIdEstado",
                        column: x => x.EstadoIdEstado,
                        principalTable: "ESTADO",
                        principalColumn: "IdEstado");
                    table.ForeignKey(
                        name: "FK_Compras_METODO_PAGO_MetodoPagoIdMetodoPago",
                        column: x => x.MetodoPagoIdMetodoPago,
                        principalTable: "METODO_PAGO",
                        principalColumn: "IdMetodoPago");
                    table.ForeignKey(
                        name: "FK_Compras_Proveedores_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "Proveedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductoProveedores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductoId = table.Column<int>(type: "int", nullable: false),
                    ProveedorId = table.Column<int>(type: "int", nullable: false),
                    PrecioCompra = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CodigoProveedor = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    TiempoEntregaDias = table.Column<int>(type: "int", nullable: false),
                    CantidadMinima = table.Column<int>(type: "int", nullable: false),
                    EsProveedorPrincipal = table.Column<bool>(type: "bit", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoProveedores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductoProveedores_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductoProveedores_Proveedores_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "Proveedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DetallesPedido",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PedidoId = table.Column<int>(type: "int", nullable: false),
                    ProductoId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Descuento = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetallesPedido", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DetallesPedido_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DetallesPedido_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DetallesVenta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VentaId = table.Column<int>(type: "int", nullable: false),
                    ProductoId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Descuento = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetallesVenta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DetallesVenta_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DetallesVenta_Ventas_VentaId",
                        column: x => x.VentaId,
                        principalTable: "Ventas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DetalleCompra",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompraId = table.Column<int>(type: "int", nullable: false),
                    ProductoId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetalleCompra", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DetalleCompra_Compras_CompraId",
                        column: x => x.CompraId,
                        principalTable: "Compras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DetalleCompra_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CATEGORIA_PRODUCTO_Nombre",
                table: "CATEGORIA_PRODUCTO",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_Documento",
                table: "Clientes",
                column: "Documento");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_Email",
                table: "Clientes",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_TipoDocumentoIdTipoDocumento",
                table: "Clientes",
                column: "TipoDocumentoIdTipoDocumento");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_EstadoIdEstado",
                table: "Compras",
                column: "EstadoIdEstado");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_MetodoPagoIdMetodoPago",
                table: "Compras",
                column: "MetodoPagoIdMetodoPago");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_ProveedorId",
                table: "Compras",
                column: "ProveedorId");

            migrationBuilder.CreateIndex(
                name: "IX_DetalleCompra_CompraId",
                table: "DetalleCompra",
                column: "CompraId");

            migrationBuilder.CreateIndex(
                name: "IX_DetalleCompra_ProductoId",
                table: "DetalleCompra",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_DetallesPedido_PedidoId",
                table: "DetallesPedido",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_DetallesPedido_ProductoId",
                table: "DetallesPedido",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_DetallesVenta_ProductoId",
                table: "DetallesVenta",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_DetallesVenta_VentaId",
                table: "DetallesVenta",
                column: "VentaId");

            migrationBuilder.CreateIndex(
                name: "IX_ESTADO_Nombre",
                table: "ESTADO",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MARCA_Nombre",
                table: "MARCA",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MEDIDA_Nombre",
                table: "MEDIDA",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_METODO_PAGO_Nombre",
                table: "METODO_PAGO",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_Codigo",
                table: "PasswordResetTokens",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId",
                table: "PasswordResetTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_ClienteId",
                table: "Pedidos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_EstadoIdEstado",
                table: "Pedidos",
                column: "EstadoIdEstado");

            migrationBuilder.CreateIndex(
                name: "IX_ProductoProveedores_ProductoId_ProveedorId",
                table: "ProductoProveedores",
                columns: new[] { "ProductoId", "ProveedorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductoProveedores_ProveedorId",
                table: "ProductoProveedores",
                column: "ProveedorId");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_IdCategoriaProducto",
                table: "Productos",
                column: "IdCategoriaProducto");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_IdMarcaProducto",
                table: "Productos",
                column: "IdMarcaProducto");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_IdMedidaProducto",
                table: "Productos",
                column: "IdMedidaProducto");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_Nombre",
                table: "Productos",
                column: "Nombre");

            migrationBuilder.CreateIndex(
                name: "IX_Proveedores_Activo",
                table: "Proveedores",
                column: "Activo");

            migrationBuilder.CreateIndex(
                name: "IX_Proveedores_Nombre",
                table: "Proveedores",
                column: "Nombre");

            migrationBuilder.CreateIndex(
                name: "IX_Proveedores_TipoDocumentoIdTipoDocumento",
                table: "Proveedores",
                column: "TipoDocumentoIdTipoDocumento");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Token",
                table: "RefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UsuarioId",
                table: "RefreshTokens",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_NombreRol",
                table: "Roles",
                column: "NombreRol",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TIPO_DOCUMENTO_Nombre",
                table: "TIPO_DOCUMENTO",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Correo",
                table: "Usuarios",
                column: "Correo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_IdRol",
                table: "Usuarios",
                column: "IdRol");

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_ClienteId",
                table: "Ventas",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_EstadoIdEstado",
                table: "Ventas",
                column: "EstadoIdEstado");

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_MetodoPagoIdMetodoPago",
                table: "Ventas",
                column: "MetodoPagoIdMetodoPago");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DetalleCompra");

            migrationBuilder.DropTable(
                name: "DetallesPedido");

            migrationBuilder.DropTable(
                name: "DetallesVenta");

            migrationBuilder.DropTable(
                name: "PasswordResetTokens");

            migrationBuilder.DropTable(
                name: "ProductoProveedores");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "Compras");

            migrationBuilder.DropTable(
                name: "Pedidos");

            migrationBuilder.DropTable(
                name: "Ventas");

            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Proveedores");

            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropTable(
                name: "ESTADO");

            migrationBuilder.DropTable(
                name: "METODO_PAGO");

            migrationBuilder.DropTable(
                name: "CATEGORIA_PRODUCTO");

            migrationBuilder.DropTable(
                name: "MARCA");

            migrationBuilder.DropTable(
                name: "MEDIDA");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "TIPO_DOCUMENTO");
        }
    }
}
