namespace PetLove.API.DTOs
{
    public class ProductoResponseDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? CodigoBarras { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public int StockMinimo { get; set; }
        public bool Activo { get; set; }
        public string? ImagenUrl { get; set; }
        public DateTime FechaRegistro { get; set; }
        
        // Referencias simplificadas
        public CategoriaSimpleDto? Categoria { get; set; }
        public MarcaSimpleDto? Marca { get; set; }
        public MedidaSimpleDto? Medida { get; set; }
    }

    public class CategoriaSimpleDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }

    public class MarcaSimpleDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }

    public class MedidaSimpleDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Abreviatura { get; set; }
    }

    public class ProductoCreateDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? CodigoBarras { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public int StockMinimo { get; set; }
        public int CategoriaId { get; set; }
        public int MarcaId { get; set; }
        public int MedidaId { get; set; }
        public string? ImagenUrl { get; set; }
    }

    public class ProductoUpdateDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? CodigoBarras { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public int StockMinimo { get; set; }
        public int CategoriaId { get; set; }
        public int MarcaId { get; set; }
        public int MedidaId { get; set; }
        public string? ImagenUrl { get; set; }
        public bool Activo { get; set; }
    }

    // DTO simplificado para referencias en otros DTOs
    public class ProductoSimpleDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? CodigoBarras { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public string? ImagenUrl { get; set; }
    }
}