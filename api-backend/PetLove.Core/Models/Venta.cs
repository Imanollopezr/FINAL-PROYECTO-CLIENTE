using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    public class Venta
    {
        public int Id { get; set; }
        
        [Required]
        public int ClienteId { get; set; }
        
        [Required]
        public DateTime FechaVenta { get; set; } = DateTime.UtcNow;
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Impuestos { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }
        
        [StringLength(20)]
        public string? NumeroFactura { get; set; }
        
        [StringLength(50)]
        public string MetodoPago { get; set; } = "Efectivo";
        
        [StringLength(20)]
        public string Estado { get; set; } = "Completada";
        
        [StringLength(500)]
        public string? Observaciones { get; set; }
        
        public DateTime? FechaActualizacion { get; set; }
        
        // Propiedades de clave foránea adicionales (generadas por EF Core)
        public int? EstadoIdEstado { get; set; }
        public int? MetodoPagoIdMetodoPago { get; set; }
        
        // Propiedades de navegación
        [ForeignKey("ClienteId")]
        public virtual Cliente? Cliente { get; set; }
        
        public virtual ICollection<DetalleVenta>? DetallesVenta { get; set; }
    }
    
    public class DetalleVenta
    {
        public int Id { get; set; }
        
        [Required]
        public int VentaId { get; set; }
        
        [Required]
        public int ProductoId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int Cantidad { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecioUnitario { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Descuento { get; set; } = 0;
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }
        
        // Propiedades de navegación
        [ForeignKey("VentaId")]
        public virtual Venta? Venta { get; set; }
        
        [ForeignKey("ProductoId")]
        public virtual Producto? Producto { get; set; }
    }
}