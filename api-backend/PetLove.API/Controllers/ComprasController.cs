using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.DTOs;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComprasController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public ComprasController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/compras
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompraResponseDto>>> GetCompras()
        {
            try
            {
                var compras = await _context.Compras
                    .Include(c => c.Proveedor)
                    .Include(c => c.DetallesCompra!)
                        .ThenInclude(dc => dc.Producto)
                    .OrderByDescending(c => c.FechaCompra)
                    .Select(c => new CompraResponseDto
                    {
                        Id = c.Id,
                        ProveedorId = c.ProveedorId,
                        FechaCompra = c.FechaCompra,
                        Subtotal = c.Subtotal,
                        Impuestos = c.Impuestos,
                        Total = c.Total,
                        PorcentajeGanancia = c.PorcentajeGanancia,
                        NumeroFactura = c.NumeroFactura,
                        Estado = c.Estado,
                        Observaciones = c.Observaciones,
                        FechaRecepcion = c.FechaRecepcion,
                        Proveedor = c.Proveedor != null ? new ProveedorSimpleDto
                        {
                            Id = c.Proveedor.Id,
                            Nombre = c.Proveedor.Nombre,
                            Documento = c.Proveedor.Documento,
                            Email = c.Proveedor.Email,
                            Celular = c.Proveedor.Celular
                        } : null,
                        DetallesCompra = c.DetallesCompra!.Select(dc => new DetalleCompraSimpleDto
                        {
                            Id = dc.Id,
                            ProductoId = dc.ProductoId,
                            Cantidad = dc.Cantidad,
                            PrecioUnitario = dc.PrecioUnitario,
                            Subtotal = dc.Subtotal,
                            Producto = dc.Producto != null ? new ProductoSimpleDto
                            {
                                Id = dc.Producto.Id,
                                Nombre = dc.Producto.Nombre,
                                Precio = dc.Producto.Precio,
                                Stock = dc.Producto.Stock
                            } : null
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(compras);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener las compras", error = ex.Message });
            }
        }

        // GET: api/compras/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CompraResponseDto>> GetCompra(int id)
        {
            try
            {
                var compra = await _context.Compras
                    .Include(c => c.Proveedor)
                    .Include(c => c.DetallesCompra!)
                        .ThenInclude(dc => dc.Producto)
                    .Where(c => c.Id == id)
                    .Select(c => new CompraResponseDto
                    {
                        Id = c.Id,
                        ProveedorId = c.ProveedorId,
                        FechaCompra = c.FechaCompra,
                        Subtotal = c.Subtotal,
                        Impuestos = c.Impuestos,
                        Total = c.Total,
                        PorcentajeGanancia = c.PorcentajeGanancia,
                        NumeroFactura = c.NumeroFactura,
                        Estado = c.Estado,
                        Observaciones = c.Observaciones,
                        FechaRecepcion = c.FechaRecepcion,
                        Proveedor = c.Proveedor != null ? new ProveedorSimpleDto
                        {
                            Id = c.Proveedor.Id,
                            Nombre = c.Proveedor.Nombre,
                            Documento = c.Proveedor.Documento,
                            Email = c.Proveedor.Email,
                            Celular = c.Proveedor.Celular
                        } : null,
                        DetallesCompra = c.DetallesCompra!.Select(dc => new DetalleCompraSimpleDto
                        {
                            Id = dc.Id,
                            ProductoId = dc.ProductoId,
                            Cantidad = dc.Cantidad,
                            PrecioUnitario = dc.PrecioUnitario,
                            Subtotal = dc.Subtotal,
                            Producto = dc.Producto != null ? new ProductoSimpleDto
                            {
                                Id = dc.Producto.Id,
                                Nombre = dc.Producto.Nombre,
                                Precio = dc.Producto.Precio,
                                Stock = dc.Producto.Stock
                            } : null
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (compra == null)
                {
                    return NotFound(new { message = "Compra no encontrada" });
                }

                return Ok(compra);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener la compra", error = ex.Message });
            }
        }

        // POST: api/compras
        [HttpPost]
        public async Task<ActionResult<CompraResponseDto>> PostCompra(CompraCreateDto compraDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Verificar que el proveedor existe
            var proveedor = await _context.Proveedores.FindAsync(compraDto.ProveedorId);
            if (proveedor == null || !proveedor.Activo)
            {
                return BadRequest("El proveedor especificado no existe o está inactivo.");
            }

            // Crear la entidad Compra desde el DTO
            var compra = new Compra
            {
                ProveedorId = compraDto.ProveedorId,
                Subtotal = compraDto.Subtotal,
                Impuestos = compraDto.Impuestos,
                Total = compraDto.Total,
                PorcentajeGanancia = compraDto.PorcentajeGanancia,
                // NumeroFactura se asignará automáticamente después de guardar para usar el Id secuencial
                Estado = compraDto.Estado,
                Observaciones = compraDto.Observaciones,
                FechaCompra = DateTime.UtcNow,
                DetallesCompra = new List<DetalleCompra>()
            };

            // Validar y procesar detalles de compra
            if (compraDto.DetallesCompra != null && compraDto.DetallesCompra.Any())
            {
                foreach (var detalleDto in compraDto.DetallesCompra)
                {
                    var producto = await _context.Productos.FindAsync(detalleDto.ProductoId);
                    if (producto == null || !producto.Activo)
                    {
                        return BadRequest($"El producto con ID {detalleDto.ProductoId} no existe o está inactivo.");
                    }

                    // Actualizar stock del producto (aumentar por compra)
                    producto.Stock += detalleDto.Cantidad;

                    // Aplicar margen de ganancia si está definido
                    // Nuevo precio de venta = precio unitario compra * (1 + porcentajeGanancia/100)
                    if (compraDto.PorcentajeGanancia > 0)
                    {
                        var nuevoPrecio = detalleDto.PrecioUnitario * (1 + (compraDto.PorcentajeGanancia / 100));
                        // Redondeo a 2 decimales para consistencia en moneda
                        producto.Precio = Math.Round(nuevoPrecio, 2);
                    }

                    // Crear detalle de compra
                    var detalle = new DetalleCompra
                    {
                        ProductoId = detalleDto.ProductoId,
                        Cantidad = detalleDto.Cantidad,
                        PrecioUnitario = detalleDto.PrecioUnitario,
                        Subtotal = detalleDto.Subtotal
                    };

                    compra.DetallesCompra.Add(detalle);
                }
            }

            _context.Compras.Add(compra);
            await _context.SaveChangesAsync();

            // Asignar número secuencial usando el Id ya generado
            compra.NumeroFactura = GenerarNumeroOrdenCompra(compra.Id);
            _context.Entry(compra).Property(c => c.NumeroFactura).IsModified = true;
            await _context.SaveChangesAsync();

            // Construir respuesta completa similar a GET
            var compraResponse = await _context.Compras
                .Include(c => c.Proveedor)
                .Include(c => c.DetallesCompra!)
                    .ThenInclude(dc => dc.Producto)
                .Where(c => c.Id == compra.Id)
                .Select(c => new CompraResponseDto
                {
                    Id = c.Id,
                    ProveedorId = c.ProveedorId,
                    FechaCompra = c.FechaCompra,
                    Subtotal = c.Subtotal,
                    Impuestos = c.Impuestos,
                    Total = c.Total,
                    PorcentajeGanancia = c.PorcentajeGanancia,
                    NumeroFactura = c.NumeroFactura,
                    Estado = c.Estado,
                    Observaciones = c.Observaciones,
                    FechaRecepcion = c.FechaRecepcion,
                    Proveedor = c.Proveedor != null ? new ProveedorSimpleDto
                    {
                        Id = c.Proveedor.Id,
                        Nombre = c.Proveedor.Nombre,
                        Documento = c.Proveedor.Documento,
                        Email = c.Proveedor.Email,
                        Celular = c.Proveedor.Celular
                    } : null,
                    DetallesCompra = c.DetallesCompra!.Select(dc => new DetalleCompraSimpleDto
                    {
                        Id = dc.Id,
                        ProductoId = dc.ProductoId,
                        Cantidad = dc.Cantidad,
                        PrecioUnitario = dc.PrecioUnitario,
                        Subtotal = dc.Subtotal,
                        Producto = dc.Producto != null ? new ProductoSimpleDto
                        {
                            Id = dc.Producto.Id,
                            Nombre = dc.Producto.Nombre,
                            Precio = dc.Producto.Precio,
                            Stock = dc.Producto.Stock
                        } : null
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetCompra), new { id = compra.Id }, compraResponse);
        }

        // PUT: api/compras/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCompra(int id, Compra compra)
        {
            if (id != compra.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingCompra = await _context.Compras
                .Include(c => c.DetallesCompra)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (existingCompra == null)
            {
                return NotFound();
            }

            // Actualizar propiedades básicas
            existingCompra.Estado = compra.Estado;
            existingCompra.Total = compra.Total;
            existingCompra.FechaCompra = compra.FechaCompra;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CompraExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/compras/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompra(int id)
        {
            var compra = await _context.Compras
                .Include(c => c.DetallesCompra!)
                    .ThenInclude(dc => dc.Producto)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null)
            {
                return NotFound();
            }

            // Revertir stock de productos si la compra se cancela
            if (compra.DetallesCompra != null)
            {
                foreach (var detalle in compra.DetallesCompra)
                {
                    if (detalle.Producto != null)
                    {
                        detalle.Producto.Stock -= detalle.Cantidad;
                        if (detalle.Producto.Stock < 0) detalle.Producto.Stock = 0;
                    }
                }
            }

            _context.Compras.Remove(compra);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/compras/proveedor/{proveedorId}
        [HttpGet("proveedor/{proveedorId}")]
        public async Task<ActionResult<IEnumerable<Compra>>> GetComprasPorProveedor(int proveedorId)
        {
            return await _context.Compras
                .Include(c => c.DetallesCompra!)
                    .ThenInclude(dc => dc.Producto)
                .Where(c => c.ProveedorId == proveedorId)
                .OrderByDescending(c => c.FechaCompra)
                .ToListAsync();
        }

        // GET: api/compras/fecha/{fecha}
        [HttpGet("fecha/{fecha}")]
        public async Task<ActionResult<IEnumerable<Compra>>> GetComprasPorFecha(DateTime fecha)
        {
            var fechaInicio = fecha.Date;
            var fechaFin = fechaInicio.AddDays(1);

            return await _context.Compras
                .Include(c => c.Proveedor)
                .Include(c => c.DetallesCompra!)
                    .ThenInclude(dc => dc.Producto)
                .Where(c => c.FechaCompra >= fechaInicio && c.FechaCompra < fechaFin)
                .OrderByDescending(c => c.FechaCompra)
                .ToListAsync();
        }

        private bool CompraExists(int id)
        {
            return _context.Compras.Any(e => e.Id == id);
        }

        // Genera número de orden de compra secuencial basado en el Id
        private string GenerarNumeroOrdenCompra(int compraId)
        {
            return $"OC{compraId.ToString().PadLeft(6, '0')}";
        }
    }
}