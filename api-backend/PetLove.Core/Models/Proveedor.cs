using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    public class Proveedor
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(20)]
        public string TipoPersona { get; set; } = "natural"; // "natural" o "juridica"
        
        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string Documento { get; set; } = string.Empty;
        
        [Required]
        [StringLength(150)]
        public string Email { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? Celular { get; set; }
        
        [StringLength(20)]
        public string? Telefono { get; set; }
        
        [StringLength(200)]
        public string? Direccion { get; set; }
        
        [StringLength(50)]
        public string? Ciudad { get; set; }
        
        // Campos específicos para Persona Natural
        [StringLength(100)]
        public string? Nombres { get; set; }
        
        [StringLength(100)]
        public string? Apellidos { get; set; }
        
        // Campos específicos para Persona Jurídica
        [StringLength(200)]
        public string? RazonSocial { get; set; }
        
        [StringLength(200)]
        public string? RepresentanteLegal { get; set; }
        
        [StringLength(50)]
        public string? NIT { get; set; }
        
        public bool Activo { get; set; } = true;
        
        public DateTime FechaRegistro { get; set; } = DateTime.Now;
        
        public DateTime? FechaActualizacion { get; set; }

        // Clave foránea para TipoDocumento
        public int? TipoDocumentoIdTipoDocumento { get; set; }

        // Propiedades de navegación
        public virtual TipoDocumento? TipoDocumento { get; set; }
        public virtual ICollection<Compra>? Compras { get; set; }
        public virtual ICollection<ProductoProveedor>? ProductoProveedores { get; set; }
    }
}