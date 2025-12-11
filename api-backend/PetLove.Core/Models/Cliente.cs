using System.ComponentModel.DataAnnotations;

namespace PetLove.Core.Models
{
    public class Cliente
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Apellido { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? Documento { get; set; }
        
        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? Telefono { get; set; }
        
        [StringLength(200)]
        public string? Direccion { get; set; }
        
        [StringLength(50)]
        public string? Ciudad { get; set; }
        
        [StringLength(10)]
        public string? CodigoPostal { get; set; }
        
        public bool Activo { get; set; } = true;
        
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
        
        public DateTime? FechaActualizacion { get; set; }
        
        // Clave foránea para TipoDocumento
        public int? TipoDocumentoIdTipoDocumento { get; set; }
        
        // Propiedades de navegación
        public virtual TipoDocumento? TipoDocumento { get; set; }
        public virtual ICollection<Venta>? Ventas { get; set; }
        public virtual ICollection<Pedido>? Pedidos { get; set; }
    }
}