using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetLove.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GananciaCalculada",
                table: "DetalleCompra");

            migrationBuilder.DropColumn(
                name: "PorcentajeGanancia",
                table: "DetalleCompra");

            migrationBuilder.DropColumn(
                name: "GananciaCalculada",
                table: "Compras");

            migrationBuilder.DropColumn(
                name: "PorcentajeGanancia",
                table: "Compras");
        }
    }
}
