using System.ComponentModel.DataAnnotations;

namespace PetLove.Core.Models
{
    public class Rol
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string NombreRol { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Descripcion { get; set; }

        public bool Activo { get; set; } = true;

        public DateTime FechaRegistro { get; set; } = DateTime.Now;

        // Propiedades de navegación
        public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
        public virtual ICollection<PermisoRol> PermisosRol { get; set; } = new List<PermisoRol>();
    }
}