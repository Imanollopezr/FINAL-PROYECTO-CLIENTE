using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.DTOs;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public ProductosController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/productos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductoResponseDto>>> GetProductos()
        {
            var productos = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Marca)
                .Include(p => p.Medida)
                .Where(p => p.Activo)
                .Select(p => new ProductoResponseDto
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    Precio = p.Precio,
                    Stock = p.Stock,
                    Activo = p.Activo,
                    ImagenUrl = p.ImagenUrl,
                    FechaRegistro = p.FechaCreacion,
                    Categoria = p.Categoria != null ? new CategoriaSimpleDto
                    {
                        Id = p.Categoria.IdCategoriaProducto,
                        Nombre = p.Categoria.Nombre,
                        Descripcion = p.Categoria.Descripcion
                    } : null,
                    Marca = p.Marca != null ? new MarcaSimpleDto
                    {
                        Id = p.Marca.IdMarca,
                        Nombre = p.Marca.Nombre,
                        Descripcion = p.Marca.Descripcion
                    } : null,
                    Medida = p.Medida != null ? new MedidaSimpleDto
                    {
                        Id = p.Medida.IdMedida,
                        Nombre = p.Medida.Nombre,
                        Abreviatura = p.Medida.Abreviatura
                    } : null
                })
                .OrderBy(p => p.Nombre)
                .ToListAsync();

            return Ok(productos);
        }

        // GET: api/productos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductoResponseDto>> GetProducto(int id)
        {
            var producto = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Marca)
                .Include(p => p.Medida)
                .Where(p => p.Id == id && p.Activo)
                .Select(p => new ProductoResponseDto
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    Precio = p.Precio,
                    Stock = p.Stock,
                    Activo = p.Activo,
                    ImagenUrl = p.ImagenUrl,
                    FechaRegistro = p.FechaCreacion,
                    Categoria = p.Categoria != null ? new CategoriaSimpleDto
                    {
                        Id = p.Categoria.IdCategoriaProducto,
                        Nombre = p.Categoria.Nombre,
                        Descripcion = p.Categoria.Descripcion
                    } : null,
                    Marca = p.Marca != null ? new MarcaSimpleDto
                    {
                        Id = p.Marca.IdMarca,
                        Nombre = p.Marca.Nombre,
                        Descripcion = p.Marca.Descripcion
                    } : null,
                    Medida = p.Medida != null ? new MedidaSimpleDto
                    {
                        Id = p.Medida.IdMedida,
                        Nombre = p.Medida.Nombre,
                        Abreviatura = p.Medida.Abreviatura
                    } : null
                })
                .FirstOrDefaultAsync();

            if (producto == null)
            {
                return NotFound();
            }

            return Ok(producto);
        }

        // POST: api/productos/con-imagen
        [HttpPost("con-imagen")]
        public async Task<ActionResult<Producto>> PostProductoConImagen([FromForm] ProductoConImagenDto dto)
        {
            try
            {
                // Validaciones de campos requeridos
                if (string.IsNullOrWhiteSpace(dto.Nombre) || dto.Nombre.Length < 2)
                {
                    return BadRequest(new { message = "El nombre del producto es requerido y debe tener al menos 2 caracteres" });
                }

                if (dto.Precio <= 0)
                {
                    return BadRequest(new { message = "El precio debe ser mayor a 0" });
                }

                if (dto.Stock < 0)
                {
                    return BadRequest(new { message = "El stock no puede ser negativo" });
                }

                // Validar relaciones
                if (dto.IdCategoriaProducto <= 0)
                {
                    return BadRequest(new { message = "Debe seleccionar una categoría válida" });
                }

                if (dto.IdMarcaProducto <= 0)
                {
                    return BadRequest(new { message = "Debe seleccionar una marca válida" });
                }

                if (dto.IdMedidaProducto <= 0)
                {
                    return BadRequest(new { message = "Debe seleccionar una medida válida" });
                }

                // Procesar imagen si se proporciona
                string? imagenUrl = null;
                if (dto.Imagen != null)
                {
                    // Validar imagen
                    var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                    var extension = Path.GetExtension(dto.Imagen.FileName).ToLowerInvariant();
                    
                    if (!extensionesPermitidas.Contains(extension))
                    {
                        return BadRequest(new { message = $"Tipo de archivo no permitido. Extensiones permitidas: {string.Join(", ", extensionesPermitidas)}" });
                    }

                    if (dto.Imagen.Length > 5 * 1024 * 1024) // 5MB
                    {
                        return BadRequest(new { message = "El archivo es demasiado grande. Tamaño máximo: 5MB" });
                    }

                    if (!dto.Imagen.ContentType.StartsWith("image/"))
                    {
                        return BadRequest(new { message = "El archivo debe ser una imagen válida" });
                    }

                    // Guardar imagen
                    var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "productos");
                    if (!Directory.Exists(uploadsPath))
                    {
                        Directory.CreateDirectory(uploadsPath);
                    }

                    var nombreArchivo = $"{Guid.NewGuid()}{extension}";
                    var rutaCompleta = Path.Combine(uploadsPath, nombreArchivo);

                    using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                    {
                        await dto.Imagen.CopyToAsync(stream);
                    }

                    imagenUrl = $"/uploads/productos/{nombreArchivo}";
                }

                // Normalizar datos
                var nombreNormalizado = dto.Nombre.Trim();

                // Verificar que el nombre no exista
                var nombreExistente = await _context.Productos
                    .AnyAsync(p => p.Nombre.ToLower() == nombreNormalizado.ToLower());

                if (nombreExistente)
                {
                    return BadRequest(new { message = "Ya existe un producto con este nombre" });
                }

                // Verificar que las relaciones existan y estén activas
                var categoriaExiste = await _context.Categorias
                    .AnyAsync(c => c.IdCategoriaProducto == dto.IdCategoriaProducto && c.Activo);
                if (!categoriaExiste)
                {
                    return BadRequest(new { message = "La categoría seleccionada no existe o no está activa" });
                }

                var marcaExiste = await _context.Marcas
                    .AnyAsync(m => m.IdMarca == dto.IdMarcaProducto && m.Activo);
                if (!marcaExiste)
                {
                    return BadRequest(new { message = "La marca seleccionada no existe o no está activa" });
                }

                var medidaExiste = await _context.Medidas
                    .AnyAsync(m => m.IdMedida == dto.IdMedidaProducto && m.Activo);
                if (!medidaExiste)
                {
                    return BadRequest(new { message = "La medida seleccionada no existe o no está activa" });
                }

                // Validar/Asignar Talla y Color por defecto
                var tallaId = dto.IdTalla <= 0 ? 1 : dto.IdTalla;
                var colorId = dto.IdColor <= 0 ? 1 : dto.IdColor;

                if (tallaId != 1)
                {
                    var tallaExiste = await _context.Tallas
                        .AnyAsync(t => t.IdTalla == tallaId && t.Activo);
                    if (!tallaExiste)
                    {
                        return BadRequest(new { message = "La talla seleccionada no existe o no está activa" });
                    }
                }

                if (colorId != 1)
                {
                    var colorExiste = await _context.Colores
                        .AnyAsync(c => c.IdColor == colorId && c.Activo);
                    if (!colorExiste)
                    {
                        return BadRequest(new { message = "El color seleccionado no existe o no está activo" });
                    }
                }

                // Crear producto
                var producto = new Producto
                {
                    Nombre = nombreNormalizado,
                    Descripcion = dto.Descripcion?.Trim(),
                    Precio = dto.Precio,
                    Stock = dto.Stock,
                    IdCategoriaProducto = dto.IdCategoriaProducto,
                    IdMarcaProducto = dto.IdMarcaProducto,
                    IdMedidaProducto = dto.IdMedidaProducto,
                    IdTalla = tallaId,
                    IdColor = colorId,
                    ImagenUrl = imagenUrl,
                    FechaCreacion = DateTime.UtcNow,
                    Activo = true
                };

                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetProducto), new { id = producto.Id }, producto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // POST: api/productos
        [HttpPost]
        public async Task<ActionResult<Producto>> PostProducto(Producto producto)
        {
            try
            {
                // Validaciones de campos requeridos
                if (string.IsNullOrWhiteSpace(producto.Nombre) || producto.Nombre.Length < 2)
                {
                    return BadRequest(new { message = "El nombre del producto es requerido y debe tener al menos 2 caracteres" });
                }

                if (producto.Precio <= 0)
                {
                    return BadRequest(new { message = "El precio debe ser mayor a 0" });
                }

                if (producto.Stock < 0)
                {
                    return BadRequest(new { message = "El stock no puede ser negativo" });
                }

                // Validar relaciones
                if (producto.IdCategoriaProducto <= 0)
                {
                    return BadRequest(new { message = "Debe seleccionar una categoría válida" });
                }

                if (producto.IdMarcaProducto <= 0)
                {
                    return BadRequest(new { message = "Debe seleccionar una marca válida" });
                }

                if (producto.IdMedidaProducto <= 0)
                {
                    return BadRequest(new { message = "Debe seleccionar una medida válida" });
                }

                // Normalizar datos
                producto.Nombre = producto.Nombre.Trim();
                producto.Descripcion = producto.Descripcion?.Trim();
                producto.ImagenUrl = producto.ImagenUrl?.Trim();

                // Verificar que el nombre no exista
                var nombreExistente = await _context.Productos
                    .AnyAsync(p => p.Nombre.ToLower() == producto.Nombre.ToLower());

                if (nombreExistente)
                {
                    return BadRequest(new { message = "Ya existe un producto con este nombre" });
                }

                // Verificar que las relaciones existan y estén activas
                var categoriaExiste = await _context.Categorias
                    .AnyAsync(c => c.IdCategoriaProducto == producto.IdCategoriaProducto && c.Activo);
                if (!categoriaExiste)
                {
                    return BadRequest(new { message = "La categoría seleccionada no existe o no está activa" });
                }

                var marcaExiste = await _context.Marcas
                    .AnyAsync(m => m.IdMarca == producto.IdMarcaProducto && m.Activo);
                if (!marcaExiste)
                {
                    return BadRequest(new { message = "La marca seleccionada no existe o no está activa" });
                }

                var medidaExiste = await _context.Medidas
                    .AnyAsync(m => m.IdMedida == producto.IdMedidaProducto && m.Activo);
                if (!medidaExiste)
                {
                    return BadRequest(new { message = "La medida seleccionada no existe o no está activa" });
                }

                // Talla/Color: asignar por defecto y validar si no es 1
                if (producto.IdTalla <= 0) producto.IdTalla = 1;
                if (producto.IdColor <= 0) producto.IdColor = 1;

                if (producto.IdTalla != 1)
                {
                    var tallaExiste = await _context.Tallas
                        .AnyAsync(t => t.IdTalla == producto.IdTalla && t.Activo);
                    if (!tallaExiste)
                    {
                        return BadRequest(new { message = "La talla seleccionada no existe o no está activa" });
                    }
                }

                if (producto.IdColor != 1)
                {
                    var colorExiste = await _context.Colores
                        .AnyAsync(c => c.IdColor == producto.IdColor && c.Activo);
                    if (!colorExiste)
                    {
                        return BadRequest(new { message = "El color seleccionado no existe o no está activo" });
                    }
                }

                producto.FechaCreacion = DateTime.UtcNow;
                producto.Activo = true;
                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetProducto), new { id = producto.Id }, producto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PUT: api/productos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProducto(int id, Producto producto)
        {
            if (id != producto.Id)
            {
                return BadRequest(new { message = "El ID del producto no coincide" });
            }

            try
            {
                // Validaciones de campos requeridos
                if (string.IsNullOrWhiteSpace(producto.Nombre) || producto.Nombre.Length < 2)
                {
                    return BadRequest(new { message = "El nombre del producto es requerido y debe tener al menos 2 caracteres" });
                }

                if (producto.Precio <= 0)
                {
                    return BadRequest(new { message = "El precio debe ser mayor a 0" });
                }

                if (producto.Stock < 0)
                {
                    return BadRequest(new { message = "El stock no puede ser negativo" });
                }

                // Validar relaciones
                if (producto.IdCategoriaProducto <= 0)
                {
                    return BadRequest(new { message = "Debe seleccionar una categoría válida" });
                }

                if (producto.IdMarcaProducto <= 0)
                {
                    return BadRequest(new { message = "Debe seleccionar una marca válida" });
                }

                if (producto.IdMedidaProducto <= 0)
                {
                    return BadRequest(new { message = "Debe seleccionar una medida válida" });
                }

                var existingProducto = await _context.Productos.FindAsync(id);
                if (existingProducto == null || !existingProducto.Activo)
                {
                    return NotFound(new { message = "Producto no encontrado" });
                }

                // Normalizar datos
                var nombreNormalizado = producto.Nombre.Trim();

                // Verificar que el nombre no exista en otro producto
                var nombreExistente = await _context.Productos
                    .AnyAsync(p => p.Nombre.ToLower() == nombreNormalizado.ToLower() && p.Id != id);

                if (nombreExistente)
                {
                    return BadRequest(new { message = "Ya existe otro producto con este nombre" });
                }

                // Verificar que las relaciones existan y estén activas
                var categoriaExiste = await _context.Categorias
                    .AnyAsync(c => c.IdCategoriaProducto == producto.IdCategoriaProducto && c.Activo);
                if (!categoriaExiste)
                {
                    return BadRequest(new { message = "La categoría seleccionada no existe o no está activa" });
                }

                var marcaExiste = await _context.Marcas
                    .AnyAsync(m => m.IdMarca == producto.IdMarcaProducto && m.Activo);
                if (!marcaExiste)
                {
                    return BadRequest(new { message = "La marca seleccionada no existe o no está activa" });
                }

                var medidaExiste = await _context.Medidas
                    .AnyAsync(m => m.IdMedida == producto.IdMedidaProducto && m.Activo);
                if (!medidaExiste)
                {
                    return BadRequest(new { message = "La medida seleccionada no existe o no está activa" });
                }

                // Talla/Color: asignar por defecto y validar si no es 1
                if (producto.IdTalla <= 0) producto.IdTalla = 1;
                if (producto.IdColor <= 0) producto.IdColor = 1;

                if (producto.IdTalla != 1)
                {
                    var tallaExiste = await _context.Tallas
                        .AnyAsync(t => t.IdTalla == producto.IdTalla && t.Activo);
                    if (!tallaExiste)
                    {
                        return BadRequest(new { message = "La talla seleccionada no existe o no está activa" });
                    }
                }

                if (producto.IdColor != 1)
                {
                    var colorExiste = await _context.Colores
                        .AnyAsync(c => c.IdColor == producto.IdColor && c.Activo);
                    if (!colorExiste)
                    {
                        return BadRequest(new { message = "El color seleccionado no existe o no está activo" });
                    }
                }

                // Actualizar propiedades con normalización
                existingProducto.Nombre = nombreNormalizado;
                existingProducto.Descripcion = producto.Descripcion?.Trim();
                existingProducto.Precio = producto.Precio;
                existingProducto.Stock = producto.Stock;
                existingProducto.IdCategoriaProducto = producto.IdCategoriaProducto;
                existingProducto.IdMarcaProducto = producto.IdMarcaProducto;
                existingProducto.IdMedidaProducto = producto.IdMedidaProducto;
                existingProducto.IdTalla = producto.IdTalla;
                existingProducto.IdColor = producto.IdColor;
                existingProducto.ImagenUrl = producto.ImagenUrl?.Trim();
                existingProducto.Activo = producto.Activo;
                existingProducto.FechaActualizacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Producto actualizado correctamente" });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductoExists(id))
                {
                    return NotFound(new { message = "Producto no encontrado" });
                }
                else
                {
                    return StatusCode(500, new { message = "Error de concurrencia al actualizar el producto" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PATCH: api/productos/5/estado
        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoProducto(int id, [FromBody] CambiarEstadoRequest request)
        {
            try
            {
                var producto = await _context.Productos.FindAsync(id);
                if (producto == null)
                {
                    return NotFound(new { message = "Producto no encontrado" });
                }

                producto.Activo = request.Activo;
                producto.FechaActualizacion = DateTime.UtcNow;
                
                // Solo marcar como modificados los campos que cambiaron
                _context.Entry(producto).Property(p => p.Activo).IsModified = true;
                _context.Entry(producto).Property(p => p.FechaActualizacion).IsModified = true;
                
                await _context.SaveChangesAsync();

                return Ok(new { message = "Estado del producto actualizado correctamente", producto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/productos/categoria/{categoriaId}
        [HttpGet("categoria/{categoriaId}")]
        public async Task<ActionResult<IEnumerable<Producto>>> GetProductosPorCategoria(int categoriaId)
        {
            return await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Marca)
                .Include(p => p.Medida)
                .Include(p => p.ProductoProveedores!)
                    .ThenInclude(pp => pp.Proveedor)
                .Where(p => p.IdCategoriaProducto == categoriaId && p.Activo)
                .OrderBy(p => p.Nombre)
                .ToListAsync();
        }

        // GET: api/productos/buscar/{termino}
        [HttpGet("buscar/{termino}")]
        public async Task<ActionResult<IEnumerable<Producto>>> BuscarProductos(string termino)
        {
            return await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Marca)
                .Include(p => p.Medida)
                .Include(p => p.ProductoProveedores!)
                    .ThenInclude(pp => pp.Proveedor)
                .Where(p => p.Activo && 
                           (p.Nombre!.Contains(termino) || 
                            p.Descripcion!.Contains(termino) ||
                            p.Categoria!.Nombre.Contains(termino) ||
                            p.Marca!.Nombre.Contains(termino)))
                .OrderBy(p => p.Nombre)
                .ToListAsync();
        }

        // DELETE: api/productos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProducto(int id)
        {
            try
            {
                var producto = await _context.Productos.FindAsync(id);
                if (producto == null || !producto.Activo)
                {
                    return NotFound(new { message = "Producto no encontrado" });
                }

                // Verificar si el producto está en pedidos pendientes o confirmados
                var productosEnPedidos = await _context.DetallesPedido
                    .Include(dp => dp.Pedido)
                    .CountAsync(dp => dp.ProductoId == id && 
                               dp.Pedido != null &&
                               (dp.Pedido.Estado == "Pendiente" || dp.Pedido.Estado == "Confirmado"));

                if (productosEnPedidos > 0)
                {
                    return BadRequest(new { message = "No se puede eliminar el producto porque está incluido en pedidos activos" });
                }

                // Verificar si el producto está en ventas
                var productosEnVentas = await _context.DetallesVenta
                    .CountAsync(dv => dv.ProductoId == id);

                if (productosEnVentas > 0)
                {
                    return BadRequest(new { message = "No se puede eliminar el producto porque tiene historial de ventas" });
                }

                // Verificar si el producto está en compras
                var productosEnCompras = await _context.DetallesCompra
                    .CountAsync(dc => dc.ProductoId == id);

                if (productosEnCompras > 0)
                {
                    return BadRequest(new { message = "No se puede eliminar el producto porque tiene historial de compras" });
                }

                // Eliminación lógica (soft delete) - marcar como inactivo
                producto.Activo = false;
                producto.FechaActualizacion = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Producto eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        private bool ProductoExists(int id)
        {
            return _context.Productos.Any(e => e.Id == id);
        }

        // ENDPOINTS PARA MANEJAR PROVEEDORES DE PRODUCTOS

        // GET: api/productos/{id}/proveedores
        [HttpGet("{id}/proveedores")]
        public async Task<ActionResult<IEnumerable<ProductoProveedor>>> GetProveedoresDeProducto(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null || !producto.Activo)
            {
                return NotFound(new { message = "Producto no encontrado" });
            }

            var proveedores = await _context.ProductoProveedores
                .Include(pp => pp.Proveedor)
                .Where(pp => pp.ProductoId == id && pp.Activo)
                .OrderBy(pp => pp.EsProveedorPrincipal ? 0 : 1)
                .ThenBy(pp => pp.PrecioCompra)
                .ToListAsync();

            return Ok(proveedores);
        }

        // POST: api/productos/{id}/proveedores
        [HttpPost("{id}/proveedores")]
        public async Task<ActionResult<ProductoProveedor>> AgregarProveedorAProducto(int id, ProductoProveedorCreateDto dto)
        {
            try
            {
                var producto = await _context.Productos.FindAsync(id);
                if (producto == null || !producto.Activo)
                {
                    return NotFound(new { message = "Producto no encontrado" });
                }

                var proveedor = await _context.Proveedores.FindAsync(dto.ProveedorId);
                if (proveedor == null || !proveedor.Activo) // Mapeo: Activo (DB) -> Estado (Frontend)
                {
                    return NotFound(new { message = "Proveedor no encontrado" });
                }

                // Verificar si ya existe la relación
                var existeRelacion = await _context.ProductoProveedores
                    .AnyAsync(pp => pp.ProductoId == id && pp.ProveedorId == dto.ProveedorId);

                if (existeRelacion)
                {
                    return BadRequest(new { message = "Ya existe una relación entre este producto y proveedor" });
                }

                // Si es proveedor principal, desmarcar otros como principales
                if (dto.EsProveedorPrincipal)
                {
                    var proveedoresPrincipales = await _context.ProductoProveedores
                        .Where(pp => pp.ProductoId == id && pp.EsProveedorPrincipal)
                        .ToListAsync();

                    foreach (var pp in proveedoresPrincipales)
                    {
                        pp.EsProveedorPrincipal = false;
                        pp.FechaActualizacion = DateTime.UtcNow;
                    }
                }

                var productoProveedor = new ProductoProveedor
                {
                    ProductoId = id,
                    ProveedorId = dto.ProveedorId,
                    PrecioCompra = dto.PrecioCompra,
                    CodigoProveedor = dto.CodigoProveedor,
                    TiempoEntregaDias = dto.TiempoEntregaDias,
                    CantidadMinima = dto.CantidadMinima,
                    EsProveedorPrincipal = dto.EsProveedorPrincipal,
                    FechaRegistro = DateTime.UtcNow
                };

                _context.ProductoProveedores.Add(productoProveedor);
                await _context.SaveChangesAsync();

                // Cargar el proveedor para la respuesta
                await _context.Entry(productoProveedor)
                    .Reference(pp => pp.Proveedor)
                    .LoadAsync();

                return CreatedAtAction(nameof(GetProveedoresDeProducto), 
                    new { id = id }, productoProveedor);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PUT: api/productos/{id}/proveedores/{proveedorId}
        [HttpPut("{id}/proveedores/{proveedorId}")]
        public async Task<IActionResult> ActualizarProveedorDeProducto(int id, int proveedorId, ProductoProveedorUpdateDto dto)
        {
            try
            {
                var productoProveedor = await _context.ProductoProveedores
                    .FirstOrDefaultAsync(pp => pp.ProductoId == id && pp.ProveedorId == proveedorId);

                if (productoProveedor == null)
                {
                    return NotFound(new { message = "Relación producto-proveedor no encontrada" });
                }

                // Si es proveedor principal, desmarcar otros como principales
                if (dto.EsProveedorPrincipal && !productoProveedor.EsProveedorPrincipal)
                {
                    var proveedoresPrincipales = await _context.ProductoProveedores
                        .Where(pp => pp.ProductoId == id && pp.EsProveedorPrincipal && pp.Id != productoProveedor.Id)
                        .ToListAsync();

                    foreach (var pp in proveedoresPrincipales)
                    {
                        pp.EsProveedorPrincipal = false;
                        pp.FechaActualizacion = DateTime.UtcNow;
                    }
                }

                // Actualizar propiedades
                productoProveedor.PrecioCompra = dto.PrecioCompra;
                productoProveedor.CodigoProveedor = dto.CodigoProveedor;
                productoProveedor.TiempoEntregaDias = dto.TiempoEntregaDias;
                productoProveedor.CantidadMinima = dto.CantidadMinima;
                productoProveedor.EsProveedorPrincipal = dto.EsProveedorPrincipal;
                productoProveedor.Activo = dto.Activo;
                productoProveedor.FechaActualizacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // DELETE: api/productos/{id}/proveedores/{proveedorId}
        [HttpDelete("{id}/proveedores/{proveedorId}")]
        public async Task<IActionResult> EliminarProveedorDeProducto(int id, int proveedorId)
        {
            try
            {
                var productoProveedor = await _context.ProductoProveedores
                    .FirstOrDefaultAsync(pp => pp.ProductoId == id && pp.ProveedorId == proveedorId);

                if (productoProveedor == null)
                {
                    return NotFound(new { message = "Relación producto-proveedor no encontrada" });
                }

                _context.ProductoProveedores.Remove(productoProveedor);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Proveedor eliminado del producto correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }
    }

    // DTOs para ProductoProveedor
    public class ProductoProveedorCreateDto
    {
        public int ProveedorId { get; set; }
        public decimal PrecioCompra { get; set; }
        public string? CodigoProveedor { get; set; }
        public int TiempoEntregaDias { get; set; } = 7;
        public int CantidadMinima { get; set; } = 1;
        public bool EsProveedorPrincipal { get; set; } = false;
    }

    public class ProductoProveedorUpdateDto
    {
        public decimal PrecioCompra { get; set; }
        public string? CodigoProveedor { get; set; }
        public int TiempoEntregaDias { get; set; }
        public int CantidadMinima { get; set; }
        public bool EsProveedorPrincipal { get; set; }
        public bool Activo { get; set; } = true;
    }

    // DTO para crear productos con imagen
    public class ProductoConImagenDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public int IdCategoriaProducto { get; set; }
        public int IdMarcaProducto { get; set; }
        public int IdMedidaProducto { get; set; }
        public int IdTalla { get; set; } = 1;
        public int IdColor { get; set; } = 1;
        public IFormFile? Imagen { get; set; }
    }

    // Nota: CambiarEstadoRequest se define en ProveedoresController
}
