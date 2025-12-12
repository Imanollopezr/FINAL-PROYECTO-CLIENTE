using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetLove.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPermissionsTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Condicional: eliminar columnas solo si existen
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'GananciaCalculada' AND Object_ID = Object_ID(N'[dbo].[DetalleCompra]'))
BEGIN
    DECLARE @DFName NVARCHAR(128);
    SELECT @DFName = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.default_object_id = dc.object_id
    JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name = N'DetalleCompra' AND c.name = N'GananciaCalculada';
    IF @DFName IS NOT NULL 
    BEGIN
        DECLARE @SQL NVARCHAR(MAX);
        SET @SQL = N'ALTER TABLE [dbo].[DetalleCompra] DROP CONSTRAINT ' + QUOTENAME(@DFName);
        EXEC sp_executesql @SQL;
    END
    ALTER TABLE [dbo].[DetalleCompra] DROP COLUMN [GananciaCalculada];
END
");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'PorcentajeGanancia' AND Object_ID = Object_ID(N'[dbo].[DetalleCompra]'))
BEGIN
    DECLARE @DFName NVARCHAR(128);
    SELECT @DFName = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.default_object_id = dc.object_id
    JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name = N'DetalleCompra' AND c.name = N'PorcentajeGanancia';
    IF @DFName IS NOT NULL 
    BEGIN
        DECLARE @SQL NVARCHAR(MAX);
        SET @SQL = N'ALTER TABLE [dbo].[DetalleCompra] DROP CONSTRAINT ' + QUOTENAME(@DFName);
        EXEC sp_executesql @SQL;
    END
    ALTER TABLE [dbo].[DetalleCompra] DROP COLUMN [PorcentajeGanancia];
END
");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'GananciaCalculada' AND Object_ID = Object_ID(N'[dbo].[Compras]'))
BEGIN
    DECLARE @DFName NVARCHAR(128);
    SELECT @DFName = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.default_object_id = dc.object_id
    JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name = N'Compras' AND c.name = N'GananciaCalculada';
    IF @DFName IS NOT NULL 
    BEGIN
        DECLARE @SQL NVARCHAR(MAX);
        SET @SQL = N'ALTER TABLE [dbo].[Compras] DROP CONSTRAINT ' + QUOTENAME(@DFName);
        EXEC sp_executesql @SQL;
    END
    ALTER TABLE [dbo].[Compras] DROP COLUMN [GananciaCalculada];
END
");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'PorcentajeGanancia' AND Object_ID = Object_ID(N'[dbo].[Compras]'))
BEGIN
    DECLARE @DFName NVARCHAR(128);
    SELECT @DFName = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.default_object_id = dc.object_id
    JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name = N'Compras' AND c.name = N'PorcentajeGanancia';
    IF @DFName IS NOT NULL 
    BEGIN
        DECLARE @SQL NVARCHAR(MAX);
        SET @SQL = N'ALTER TABLE [dbo].[Compras] DROP CONSTRAINT ' + QUOTENAME(@DFName);
        EXEC sp_executesql @SQL;
    END
    ALTER TABLE [dbo].[Compras] DROP COLUMN [PorcentajeGanancia];
END
");

            migrationBuilder.CreateTable(
                name: "PERMISO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PERMISO", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PERMISO_ROL",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RolId = table.Column<int>(type: "int", nullable: false),
                    PermisoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PERMISO_ROL", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PERMISO_ROL_PERMISO_PermisoId",
                        column: x => x.PermisoId,
                        principalTable: "PERMISO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PERMISO_ROL_Roles_RolId",
                        column: x => x.RolId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PERMISO_Nombre",
                table: "PERMISO",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PERMISO_ROL_PermisoId",
                table: "PERMISO_ROL",
                column: "PermisoId");

            migrationBuilder.CreateIndex(
                name: "IX_PERMISO_ROL_RolId_PermisoId",
                table: "PERMISO_ROL",
                columns: new[] { "RolId", "PermisoId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PERMISO_ROL");

            migrationBuilder.DropTable(
                name: "PERMISO");

            migrationBuilder.AddColumn<decimal>(
                name: "GananciaCalculada",
                table: "DetalleCompra",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PorcentajeGanancia",
                table: "DetalleCompra",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GananciaCalculada",
                table: "Compras",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PorcentajeGanancia",
                table: "Compras",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
