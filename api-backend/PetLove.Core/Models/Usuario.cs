using System.ComponentModel.DataAnnotations;

namespace PetLove.Core.Models
{
    public class Usuario
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombres { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Apellidos { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Correo { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string Clave { get; set; } = string.Empty;

        public int IdRol { get; set; }

        public bool Activo { get; set; } = true;

        public DateTime FechaRegistro { get; set; } = DateTime.Now;

        // URL de la imagen de perfil del usuario (opcional)
        public string? ImagenUrl { get; set; }

        // Propiedades de navegación
        public virtual Rol Rol { get; set; } = null!;
    }
}