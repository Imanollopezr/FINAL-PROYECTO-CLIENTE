using System.ComponentModel.DataAnnotations;

namespace PetLove.Core.Models
{
    public class Permiso
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; }

        [MaxLength(250)]
        public string Descripcion { get; set; }

        public bool Activo { get; set; } = true;
        public DateTime FechaRegistro { get; set; } = DateTime.Now;

        // Navegación N-M con Roles
        public ICollection<PermisoRol> PermisosRol { get; set; }
    }
}