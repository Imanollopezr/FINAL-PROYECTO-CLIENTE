using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    [Table("METODO_PAGO")]
    public class MetodoPago
    {
        [Key]
        [Column("IdMetodoPago")]
        public int IdMetodoPago { get; set; }

        [Required(ErrorMessage = "El nombre del método de pago es obligatorio")]
        [StringLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
        [Column("Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
        [Column("Descripcion")]
        public string? Descripcion { get; set; }

        [Column("Activo")]
        public bool Activo { get; set; } = true;

        [Column("FechaRegistro")]
        public DateTime FechaRegistro { get; set; } = DateTime.Now;

        // Propiedades de navegación
        public virtual ICollection<Compra> Compras { get; set; } = new List<Compra>();
        public virtual ICollection<Venta> Ventas { get; set; } = new List<Venta>();
    }
}