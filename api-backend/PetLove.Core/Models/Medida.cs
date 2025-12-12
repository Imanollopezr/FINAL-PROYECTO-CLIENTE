using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    [Table("MEDIDA")]
    public class Medida
    {
        [Key]
        [Column("IdMedida")]
        public int IdMedida { get; set; }

        [Required(ErrorMessage = "El nombre de la medida es obligatorio")]
        [StringLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(10, ErrorMessage = "La abreviatura no puede exceder 10 caracteres")]
        [Column("Abreviatura")]
        public string? Abreviatura { get; set; }

        [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
        [Column("Descripcion")]
        public string? Descripcion { get; set; }

        [Column("Activo")]
        public bool Activo { get; set; } = true;

        [Column("FechaRegistro")]
        public DateTime FechaRegistro { get; set; } = DateTime.Now;

        // Propiedades de navegación
        public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
    }
}