namespace PetLove.API.DTOs
{
    public class VentaResponseDto
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public DateTime FechaVenta { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Impuestos { get; set; }
        public decimal Total { get; set; }
        public string? NumeroFactura { get; set; }
        public string? MetodoPago { get; set; }
        public string Estado { get; set; } = string.Empty;
        public string? Observaciones { get; set; }
        
        // Cliente simplificado
        public ClienteSimpleDto? Cliente { get; set; }
        
        // Detalles simplificados
        public List<DetalleVentaSimpleDto> DetallesVenta { get; set; } = new();
    }

    public class DetalleVentaSimpleDto
    {
        public int Id { get; set; }
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Descuento { get; set; }
        public decimal Subtotal { get; set; }
        
        // Producto simplificado
        public ProductoSimpleDto? Producto { get; set; }
    }

    public class VentaCreateDto
    {
        public int ClienteId { get; set; }
        public int? UsuarioId { get; set; }
        public DateTime? FechaVenta { get; set; }
        public string? MetodoPago { get; set; }
        public string? Estado { get; set; }
        public string? Observaciones { get; set; }
        public List<DetalleVentaCreateDto> DetallesVenta { get; set; } = new();
    }

    public class DetalleVentaCreateDto
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Descuento { get; set; } = 0;
        public decimal Subtotal { get; set; }
    }

    public class VentaCreateInputDto
    {
        public int ClienteId { get; set; }
        public int? UsuarioId { get; set; }
        public DateTime? FechaVenta { get; set; }
        public string? MetodoPago { get; set; }
        public string? Estado { get; set; }
        public string? Observaciones { get; set; }
        public List<DetalleVentaCreateInputDto> DetallesVenta { get; set; } = new();
        public string? Documento { get; set; }
        public string? Telefono { get; set; }
        public string? Ciudad { get; set; }
    }

    public class DetalleVentaCreateInputDto
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal? PrecioUnitario { get; set; }
        public decimal Descuento { get; set; } = 0;
    }

    // DTOs simplificados para referencias
    public class ClienteSimpleDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Documento { get; set; }
        public string? Ciudad { get; set; }
    }

    public class ProveedorSimpleDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Documento { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? Celular { get; set; }
        public string? Telefono { get; set; }
    }
}
