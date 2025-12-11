using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    [Table("COLOR")]
    public class Color
    {
        [Key]
        [Column("IdColor")]
        public int IdColor { get; set; }

        [Required(ErrorMessage = "El nombre del color es obligatorio")]
        [StringLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;

        // Código de color opcional (hex/css)
        [StringLength(50)]
        [Column("Codigo")]
        public string? Codigo { get; set; }

        [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
        [Column("Descripcion")]
        public string? Descripcion { get; set; }

        [Column("Activo")]
        public bool Activo { get; set; } = true;

        [Column("FechaRegistro")]
        public DateTime FechaRegistro { get; set; } = DateTime.Now;
    }
}
