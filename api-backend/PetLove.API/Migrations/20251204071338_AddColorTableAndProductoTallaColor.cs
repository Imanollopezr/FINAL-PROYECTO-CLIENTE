using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetLove.API.Migrations
{
    /// <inheritdoc />
    public partial class AddColorTableAndProductoTallaColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IdColor",
                table: "Productos",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "IdTalla",
                table: "Productos",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "COLOR",
                columns: table => new
                {
                    IdColor = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Codigo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COLOR", x => x.IdColor);
                });

            // Sembrar registros 'No aplica' para COLOR y asegurar en TALLA
            migrationBuilder.Sql("INSERT INTO COLOR (Nombre, Codigo, Descripcion, Activo, FechaRegistro) VALUES ('No aplica', NULL, 'Valor por defecto', 1, GETDATE());");
            migrationBuilder.Sql(@"IF NOT EXISTS (SELECT 1 FROM TALLA WHERE IdTalla = 1)
BEGIN
    SET IDENTITY_INSERT TALLA ON;
    INSERT INTO TALLA (IdTalla, Nombre, Abreviatura, Descripcion, Activo, FechaRegistro)
    VALUES (1, 'No aplica', NULL, 'Valor por defecto', 1, GETDATE());
    SET IDENTITY_INSERT TALLA OFF;
END");

            // Actualizar productos existentes con valor por defecto 1
            migrationBuilder.Sql("UPDATE Productos SET IdColor = 1 WHERE IdColor = 0;");
            migrationBuilder.Sql("UPDATE Productos SET IdTalla = 1 WHERE IdTalla = 0;");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_IdColor",
                table: "Productos",
                column: "IdColor");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_IdTalla",
                table: "Productos",
                column: "IdTalla");

            migrationBuilder.CreateIndex(
                name: "IX_COLOR_Nombre",
                table: "COLOR",
                column: "Nombre",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_COLOR_IdColor",
                table: "Productos",
                column: "IdColor",
                principalTable: "COLOR",
                principalColumn: "IdColor",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_TALLA_IdTalla",
                table: "Productos",
                column: "IdTalla",
                principalTable: "TALLA",
                principalColumn: "IdTalla",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Productos_COLOR_IdColor",
                table: "Productos");

            migrationBuilder.DropForeignKey(
                name: "FK_Productos_TALLA_IdTalla",
                table: "Productos");

            migrationBuilder.DropTable(
                name: "COLOR");

            migrationBuilder.DropIndex(
                name: "IX_Productos_IdColor",
                table: "Productos");

            migrationBuilder.DropIndex(
                name: "IX_Productos_IdTalla",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "IdColor",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "IdTalla",
                table: "Productos");
        }
    }
}
