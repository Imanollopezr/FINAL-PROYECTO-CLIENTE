using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    [Table("Compras")]
    public class Compra
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int ProveedorId { get; set; }
        
        [Required]
        public DateTime FechaCompra { get; set; } = DateTime.Now;
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Impuestos { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PorcentajeGanancia { get; set; } = 0;
        
        [MaxLength(20)]
        public string? NumeroFactura { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = "Pendiente";
        
        [MaxLength(500)]
        public string? Observaciones { get; set; }
        
        public DateTime? FechaRecepcion { get; set; }
        
        public DateTime? FechaActualizacion { get; set; }
        
        public int? EstadoIdEstado { get; set; }
        
        public int? MetodoPagoIdMetodoPago { get; set; }
        
        // Propiedades de navegación
        [ForeignKey("ProveedorId")]
        public virtual Proveedor? Proveedor { get; set; }
        
        public virtual ICollection<DetalleCompra>? DetallesCompra { get; set; }
    }
    
    [Table("DetallesCompra")]
    public class DetalleCompra
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int CompraId { get; set; }
        
        [Required]
        public int ProductoId { get; set; }
        
        [Required]
        public int Cantidad { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecioUnitario { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }
        
        // Propiedades de navegación
        [ForeignKey("CompraId")]
        public virtual Compra? Compra { get; set; }
        
        [ForeignKey("ProductoId")]
        public virtual Producto? Producto { get; set; }
    }
}