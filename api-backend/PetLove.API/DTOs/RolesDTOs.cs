using System.ComponentModel.DataAnnotations;

namespace PetLove.API.DTOs
{
    public class RolWithPermisosDto
    {
        public int Id { get; set; }
        public string NombreRol { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaRegistro { get; set; }
        public List<string> Permisos { get; set; } = new();
    }
}