using System.ComponentModel.DataAnnotations;

namespace PetLove.API.DTOs
{
    public class ProveedorCreateDto
    {
        [Required(ErrorMessage = "El tipo de persona es requerido")]
        [StringLength(20, ErrorMessage = "El tipo de persona no puede exceder 20 caracteres")]
        public string TipoPersona { get; set; } = string.Empty; // "natural" o "juridica"

        [Required(ErrorMessage = "El nombre es requerido")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El documento es requerido")]
        [StringLength(50, ErrorMessage = "El documento no puede exceder 50 caracteres")]
        public string Documento { get; set; } = string.Empty;

        [Required(ErrorMessage = "El email es requerido")]
        [EmailAddress(ErrorMessage = "El formato del email no es válido")]
        [StringLength(150, ErrorMessage = "El email no puede exceder 150 caracteres")]
        public string Email { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "El celular no puede exceder 20 caracteres")]
        public string? Celular { get; set; }

        [StringLength(20, ErrorMessage = "El teléfono no puede exceder 20 caracteres")]
        public string? Telefono { get; set; }

        [StringLength(200, ErrorMessage = "La dirección no puede exceder 200 caracteres")]
        public string? Direccion { get; set; }

        [StringLength(50, ErrorMessage = "La ciudad no puede exceder 50 caracteres")]
        public string? Ciudad { get; set; }

        // Campos específicos para Persona Natural
        [StringLength(100, ErrorMessage = "Los nombres no pueden exceder 100 caracteres")]
        public string? Nombres { get; set; }

        [StringLength(100, ErrorMessage = "Los apellidos no pueden exceder 100 caracteres")]
        public string? Apellidos { get; set; }

        // Campos específicos para Persona Jurídica
        [StringLength(200, ErrorMessage = "La razón social no puede exceder 200 caracteres")]
        public string? RazonSocial { get; set; }

        [StringLength(200, ErrorMessage = "El representante legal no puede exceder 200 caracteres")]
        public string? RepresentanteLegal { get; set; }

        [StringLength(50, ErrorMessage = "El NIT no puede exceder 50 caracteres")]
        public string? NIT { get; set; }

        public int? TipoDocumentoIdTipoDocumento { get; set; }
    }

    public class ProveedorUpdateDto : ProveedorCreateDto
    {
        public int Id { get; set; }
        public bool Activo { get; set; } = true;
    }

    public class ProveedorResponseDto
    {
        public int Id { get; set; }
        public string TipoPersona { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Celular { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? Ciudad { get; set; }
        // Campos específicos
        public string? Nombres { get; set; }
        public string? Apellidos { get; set; }
        public string? RazonSocial { get; set; }
        public string? RepresentanteLegal { get; set; }
        public string? NIT { get; set; }
        
        public bool Activo { get; set; }
        public DateTime FechaRegistro { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public int? TipoDocumentoIdTipoDocumento { get; set; }
        public string? TipoDocumentoNombre { get; set; }
    }
}