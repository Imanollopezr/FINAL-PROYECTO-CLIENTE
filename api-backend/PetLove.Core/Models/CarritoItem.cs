using System.ComponentModel.DataAnnotations;

namespace PetLove.Core.Models
{
    public class CarritoItem
    {
        public int Id { get; set; }
        
        [Required]
        public int CarritoId { get; set; }
        
        [Required]
        public int ProductoId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int Cantidad { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a 0")]
        public decimal PrecioUnitario { get; set; }
        
        public DateTime FechaAgregado { get; set; } = DateTime.UtcNow;
        
        public DateTime? FechaActualizacion { get; set; }
        
        // Propiedades calculadas
        public decimal Subtotal => Cantidad * PrecioUnitario;
        
        // Propiedades de navegación
        public virtual Carrito Carrito { get; set; } = null!;
        public virtual Producto Producto { get; set; } = null!;
    }
}