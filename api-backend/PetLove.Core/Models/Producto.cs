using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetLove.Core.Models
{
    public class Producto
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Descripcion { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a 0")]
        public decimal Precio { get; set; }
        
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "El stock no puede ser negativo")]
        public int Stock { get; set; }
        
        // Foreign Keys para tablas maestras
        [Required]
        public int IdCategoriaProducto { get; set; }
        
        [Required]
        public int IdMarcaProducto { get; set; }
        
        [Required]
        public int IdMedidaProducto { get; set; }

        // Nuevas relaciones: Talla y Color
        [Required]
        public int IdTalla { get; set; } = 1;

        [Required]
        public int IdColor { get; set; } = 1;
        
        [StringLength(200)]
        public string? ImagenUrl { get; set; }
        
        public bool Activo { get; set; } = true;
        
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        
        public DateTime? FechaActualizacion { get; set; }
        
        // Propiedades de navegación
        [ForeignKey("IdCategoriaProducto")]
        public virtual Categoria? Categoria { get; set; }
        
        [ForeignKey("IdMarcaProducto")]
        public virtual Marca? Marca { get; set; }
        
        [ForeignKey("IdMedidaProducto")]
        public virtual Medida? Medida { get; set; }

        [ForeignKey("IdTalla")]
        public virtual Talla? Talla { get; set; }

        [ForeignKey("IdColor")]
        public virtual Color? Color { get; set; }
        
        public virtual ICollection<DetalleVenta>? DetallesVenta { get; set; }
        public virtual ICollection<DetalleCompra>? DetallesCompra { get; set; }
        public virtual ICollection<DetallePedido>? DetallesPedido { get; set; }
        public virtual ICollection<ProductoProveedor>? ProductoProveedores { get; set; }
    }
}
