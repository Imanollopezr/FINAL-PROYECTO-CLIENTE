using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    public class PasswordResetToken
    {
        public int Id { get; set; }

        [Required]
        [StringLength(6)]
        public string Codigo { get; set; } = string.Empty;

        public int UsuarioId { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public DateTime FechaExpiracion { get; set; }

        public bool Usado { get; set; } = false;

        [StringLength(45)]
        public string? DireccionIP { get; set; }

        [StringLength(500)]
        public string? UserAgent { get; set; }

        // Propiedades de navegación
        public virtual Usuario Usuario { get; set; } = null!;

        // Propiedades calculadas
        [NotMapped]
        public bool EsValido => !Usado && DateTime.UtcNow <= FechaExpiracion;

        [NotMapped]
        public bool EsExpirado => DateTime.UtcNow > FechaExpiracion;
    }
}