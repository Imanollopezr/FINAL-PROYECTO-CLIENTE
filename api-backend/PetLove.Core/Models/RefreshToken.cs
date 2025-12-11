using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    public class RefreshToken
    {
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Token { get; set; } = string.Empty;

        public int UsuarioId { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public DateTime FechaExpiracion { get; set; }

        public bool Usado { get; set; } = false;

        public bool Revocado { get; set; } = false;

        [StringLength(255)]
        public string? ReemplazadoPor { get; set; }

        [StringLength(500)]
        public string? RazonRevocacion { get; set; }

        [StringLength(45)]
        public string? DireccionIP { get; set; }

        [StringLength(500)]
        public string? UserAgent { get; set; }

        // Propiedades de navegación
        public virtual Usuario Usuario { get; set; } = null!;

        // Propiedades calculadas
        [NotMapped]
        public bool EsActivo => !Revocado && !Usado && DateTime.UtcNow <= FechaExpiracion;

        [NotMapped]
        public bool EsExpirado => DateTime.UtcNow > FechaExpiracion;
    }
}