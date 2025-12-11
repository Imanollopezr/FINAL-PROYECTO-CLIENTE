using System.ComponentModel.DataAnnotations;

namespace PetLove.API.DTOs
{
    // DTO para respuesta de Cliente
    public class ClienteResponseDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? Ciudad { get; set; }
        public string? Documento { get; set; }
        public string? CodigoPostal { get; set; }
        public DateTime FechaRegistro { get; set; }
        public bool Activo { get; set; }
        public int TotalVentas { get; set; }
        public int TotalPedidos { get; set; }
    }

    // DTO para crear Cliente
    public class ClienteCreateDto
    {
        [Required(ErrorMessage = "El nombre es requerido")]
        [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El apellido es requerido")]
        [StringLength(100, ErrorMessage = "El apellido no puede exceder 100 caracteres")]
        public string Apellido { get; set; } = string.Empty;

        [Required(ErrorMessage = "El email es requerido")]
        [EmailAddress(ErrorMessage = "El formato del email no es válido")]
        [StringLength(200, ErrorMessage = "El email no puede exceder 200 caracteres")]
        public string Email { get; set; } = string.Empty;

        [Phone(ErrorMessage = "El formato del teléfono no es válido")]
        [StringLength(20, ErrorMessage = "El teléfono no puede exceder 20 caracteres")]
        public string? Telefono { get; set; }

        [StringLength(500, ErrorMessage = "La dirección no puede exceder 500 caracteres")]
        public string? Direccion { get; set; }

        [StringLength(20, ErrorMessage = "El documento no puede exceder 20 caracteres")]
        public string? Documento { get; set; }

        [StringLength(50, ErrorMessage = "La ciudad no puede exceder 50 caracteres")]
        public string? Ciudad { get; set; }

        [StringLength(10, ErrorMessage = "El código postal no puede exceder 10 caracteres")]
        public string? CodigoPostal { get; set; }
    }

    // DTO para actualizar Cliente
    public class ClienteUpdateDto
    {
        [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
        public string? Nombre { get; set; }

        [StringLength(100, ErrorMessage = "El apellido no puede exceder 100 caracteres")]
        public string? Apellido { get; set; }

        [EmailAddress(ErrorMessage = "El formato del email no es válido")]
        [StringLength(200, ErrorMessage = "El email no puede exceder 200 caracteres")]
        public string? Email { get; set; }

        [Phone(ErrorMessage = "El formato del teléfono no es válido")]
        [StringLength(20, ErrorMessage = "El teléfono no puede exceder 20 caracteres")]
        public string? Telefono { get; set; }

        [StringLength(500, ErrorMessage = "La dirección no puede exceder 500 caracteres")]
        public string? Direccion { get; set; }

        public bool? Activo { get; set; }

        [StringLength(20, ErrorMessage = "El documento no puede exceder 20 caracteres")]
        public string? Documento { get; set; }

        [StringLength(50, ErrorMessage = "La ciudad no puede exceder 50 caracteres")]
        public string? Ciudad { get; set; }

        [StringLength(10, ErrorMessage = "El código postal no puede exceder 10 caracteres")]
        public string? CodigoPostal { get; set; }
    }

    public class ClienteContactoUpdateDto
    {
        public string? Documento { get; set; }
        public string? Telefono { get; set; }
        public string? Ciudad { get; set; }
    }


}
