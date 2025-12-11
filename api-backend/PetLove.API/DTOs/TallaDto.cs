using System.ComponentModel.DataAnnotations;

namespace PetLove.API.DTOs
{
    public class TallaDto
    {
        public int IdTalla { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Abreviatura { get; set; }
        public string? Descripcion { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaRegistro { get; set; }
    }

    public class TallaCreateDto
    {
        [Required(ErrorMessage = "El nombre de la talla es obligatorio")]
        [StringLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(10, ErrorMessage = "La abreviatura no puede exceder 10 caracteres")]
        public string? Abreviatura { get; set; }

        [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
        public string? Descripcion { get; set; }
    }

    public class TallaUpdateDto
    {
        [Required(ErrorMessage = "El nombre de la talla es obligatorio")]
        [StringLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(10, ErrorMessage = "La abreviatura no puede exceder 10 caracteres")]
        public string? Abreviatura { get; set; }

        [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
        public string? Descripcion { get; set; }

        public bool Activo { get; set; } = true;
    }
}
