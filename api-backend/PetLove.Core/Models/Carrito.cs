using System.ComponentModel.DataAnnotations;

namespace PetLove.Core.Models
{
    public class Carrito
    {
        public int Id { get; set; }
        
        [Required]
        public int UsuarioId { get; set; }
        
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        
        public DateTime? FechaActualizacion { get; set; }
        
        public bool Activo { get; set; } = true;
        
        // Propiedades de navegación
        public virtual Usuario Usuario { get; set; } = null!;
        public virtual ICollection<CarritoItem> Items { get; set; } = new List<CarritoItem>();
    }
}