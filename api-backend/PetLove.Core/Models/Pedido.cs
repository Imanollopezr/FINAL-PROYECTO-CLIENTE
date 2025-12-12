using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    public class Pedido
    {
        public int Id { get; set; }
        
        [Required]
        public int ClienteId { get; set; }
        
        [Required]
        public DateTime FechaPedido { get; set; } = DateTime.UtcNow;
        
        public DateTime? FechaEntrega { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Procesando, Enviado, Entregado, Cancelado
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostoEnvio { get; set; } = 0;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Impuestos { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }
        
        [StringLength(200)]
        public string? DireccionEntrega { get; set; }
        
        [StringLength(50)]
        public string? CiudadEntrega { get; set; }
        
        [StringLength(10)]
        public string? CodigoPostalEntrega { get; set; }
        
        [StringLength(20)]
        public string? TelefonoContacto { get; set; }
        
        [StringLength(500)]
        public string? Observaciones { get; set; }
        
        [StringLength(50)]
        public string? NumeroSeguimiento { get; set; }
        
        public DateTime? FechaActualizacion { get; set; }
        
        // Propiedades de navegación
        [ForeignKey("ClienteId")]
        public virtual Cliente? Cliente { get; set; }
        
        public virtual ICollection<DetallePedido>? DetallesPedido { get; set; }
    }
    
    public class DetallePedido
    {
        public int Id { get; set; }
        
        [Required]
        public int PedidoId { get; set; }
        
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
        [ForeignKey("PedidoId")]
        public virtual Pedido? Pedido { get; set; }
        
        [ForeignKey("ProductoId")]
        public virtual Producto? Producto { get; set; }
    }
}