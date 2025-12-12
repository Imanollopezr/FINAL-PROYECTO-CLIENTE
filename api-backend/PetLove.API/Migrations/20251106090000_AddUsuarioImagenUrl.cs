using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using PetLove.Infrastructure.Data;

namespace PetLove.API.Migrations
{
    [DbContext(typeof(PetLoveDbContext))]
    [Migration("20251106090000_AddUsuarioImagenUrl")]
    public partial class AddUsuarioImagenUrl : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagenUrl",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagenUrl",
                table: "Usuarios");
        }
    }
}