using PetLove.API.DTOs;

namespace PetLove.API.DTOs
{
    public class CompraResponseDto
    {
        public int Id { get; set; }
        public int ProveedorId { get; set; }
        public DateTime FechaCompra { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Impuestos { get; set; }
        public decimal Total { get; set; }
        public decimal PorcentajeGanancia { get; set; }
        public string? NumeroFactura { get; set; }
        public string Estado { get; set; } = string.Empty;
        public string? Observaciones { get; set; }
        public DateTime? FechaRecepcion { get; set; }
        
        // Proveedor simplificado
        public ProveedorSimpleDto? Proveedor { get; set; }
        
        // Detalles simplificados
        public List<DetalleCompraSimpleDto> DetallesCompra { get; set; } = new();
    }

    public class DetalleCompraSimpleDto
    {
        public int Id { get; set; }
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
        
        // Producto simplificado
        public ProductoSimpleDto? Producto { get; set; }
    }

    public class CompraCreateDto
    {
        public int ProveedorId { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Impuestos { get; set; }
        public decimal Total { get; set; }
        public decimal PorcentajeGanancia { get; set; }
        public string? NumeroFactura { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public string? Observaciones { get; set; }
        public List<DetalleCompraCreateDto> DetallesCompra { get; set; } = new();
    }

    public class DetalleCompraCreateDto
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }
}