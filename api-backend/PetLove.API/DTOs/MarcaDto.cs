using System.ComponentModel.DataAnnotations;

namespace PetLove.API.DTOs
{
    public class MarcaDto
    {
        public int IdMarca { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaRegistro { get; set; }
    }

    public class MarcaCreateDto
    {
        [Required(ErrorMessage = "El nombre de la marca es obligatorio")]
        [StringLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
        public string? Descripcion { get; set; }
    }

    public class MarcaUpdateDto
    {
        [Required(ErrorMessage = "El nombre de la marca es obligatorio")]
        [StringLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
        public string? Descripcion { get; set; }

        public bool Activo { get; set; } = true;
    }
}