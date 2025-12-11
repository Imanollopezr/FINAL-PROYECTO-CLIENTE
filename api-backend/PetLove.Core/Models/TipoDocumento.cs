using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    [Table("TIPO_DOCUMENTO")]
    public class TipoDocumento
    {
        [Key]
        [Column("IdTipoDocumento")]
        public int IdTipoDocumento { get; set; }

        [Required(ErrorMessage = "El nombre del tipo de documento es obligatorio")]
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
        public virtual ICollection<Proveedor> Proveedores { get; set; } = new List<Proveedor>();
        public virtual ICollection<Cliente> Clientes { get; set; } = new List<Cliente>();
    }
}