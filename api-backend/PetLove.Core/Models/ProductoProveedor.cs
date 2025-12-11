using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    public class ProductoProveedor
    {
        public int Id { get; set; }
        
        [Required]
        public int ProductoId { get; set; }
        
        [Required]
        public int ProveedorId { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio de compra debe ser mayor a 0")]
        public decimal PrecioCompra { get; set; }
        
        [StringLength(50)]
        public string? CodigoProveedor { get; set; }
        
        [Range(1, int.MaxValue, ErrorMessage = "El tiempo de entrega debe ser mayor a 0")]
        public int TiempoEntregaDias { get; set; } = 7;
        
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad mínima debe ser mayor a 0")]
        public int CantidadMinima { get; set; } = 1;
        
        public bool EsProveedorPrincipal { get; set; } = false;
        
        public bool Activo { get; set; } = true;
        
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
        
        public DateTime? FechaActualizacion { get; set; }
        
        // Propiedades de navegación
        [ForeignKey("ProductoId")]
        public virtual Producto? Producto { get; set; }
        
        [ForeignKey("ProveedorId")]
        public virtual Proveedor? Proveedor { get; set; }
    }
}