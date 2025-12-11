using System.ComponentModel.DataAnnotations;

namespace PetLove.API.DTOs
{
    public class CarritoDto
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public List<CarritoItemDto> Items { get; set; } = new List<CarritoItemDto>();
        public decimal Total => Items.Sum(i => i.Subtotal);
    }

    public class CarritoItemDto
    {
        public int Id { get; set; }
        public int CarritoId { get; set; }
        public int ProductoId { get; set; }
        public string ProductoNombre { get; set; } = string.Empty;
        public string? ProductoImagen { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
        public DateTime FechaAgregado { get; set; }
    }

    public class AgregarItemCarritoDto
    {
        [Required]
        public int ProductoId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int Cantidad { get; set; }
    }

    public class ActualizarItemCarritoDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int Cantidad { get; set; }
    }

    public class CarritoResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public CarritoDto? Data { get; set; }
    }

    public class ProcesarCompraDto
    {
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? Ciudad { get; set; }
        public string? CodigoPostal { get; set; }
        public string? Documento { get; set; }
        public int? TipoDocumentoId { get; set; }
        public string? MetodoPago { get; set; }
        public string? MetodoTransferencia { get; set; }
        public string? Observaciones { get; set; }
    }

    public class ProcesarCompraResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? VentaId { get; set; }
        public string? NumeroFactura { get; set; }
        public decimal? Total { get; set; }
        public bool EsNuevoCliente { get; set; }
    }
}