using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.DTOs;

namespace PetLove.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VentasController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public VentasController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/Ventas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VentaResponseDto>>> GetVentas()
        {
            try
            {
                // Materializar primero para evitar problemas de traducción de LINQ en EF Core
                var ventasDb = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.DetallesVenta!)
                        .ThenInclude(dv => dv.Producto)
                    .OrderByDescending(v => v.FechaVenta)
                    .AsNoTracking()
                    .ToListAsync();

                var ventas = ventasDb.Select(v => new VentaResponseDto
                {
                    Id = v.Id,
                    FechaVenta = v.FechaVenta,
                    Subtotal = v.Subtotal,
                    Impuestos = v.Impuestos,
                    Total = v.Total,
                    MetodoPago = v.MetodoPago,
                    Cliente = v.Cliente != null ? new ClienteSimpleDto
                    {
                        Id = v.Cliente.Id,
                        Nombre = v.Cliente.Nombre,
                        Documento = v.Cliente.Documento,
                        Ciudad = v.Cliente.Ciudad,
                        Email = v.Cliente.Email
                    } : new ClienteSimpleDto {
                        Id = 0,
                        Nombre = string.Empty,
                        Documento = string.Empty,
                        Ciudad = string.Empty,
                        Email = string.Empty
                    },
                    DetallesVenta = (v.DetallesVenta ?? new List<DetalleVenta>()).Select(dv => new DetalleVentaSimpleDto
                    {
                        Id = dv.Id,
                        Cantidad = dv.Cantidad,
                        PrecioUnitario = dv.PrecioUnitario,
                        Subtotal = dv.Subtotal,
                        Producto = dv.Producto != null ? new ProductoSimpleDto
                        {
                            Id = dv.Producto.Id,
                            Nombre = dv.Producto.Nombre,
                            Precio = dv.Producto.Precio
                        } : new ProductoSimpleDto {
                            Id = 0,
                            Nombre = string.Empty,
                            Precio = 0m
                        }
                    }).ToList()
                }).ToList();

                return Ok(ventas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener las ventas", error = ex.Message });
            }
        }

        // GET: api/Ventas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<VentaResponseDto>> GetVenta(int id)
        {
            try
            {
                var venta = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.DetallesVenta!)
                        .ThenInclude(dv => dv.Producto)
                    .Where(v => v.Id == id)
                    .Select(v => new VentaResponseDto
                    {
                        Id = v.Id,
                        FechaVenta = v.FechaVenta,
                        Subtotal = v.Subtotal,
                        Impuestos = v.Impuestos,
                        Total = v.Total,
                        MetodoPago = v.MetodoPago,
                        Cliente = v.Cliente != null ? new ClienteSimpleDto
                        {
                            Id = v.Cliente.Id,
                            Nombre = v.Cliente.Nombre,
                            Documento = v.Cliente.Documento,
                            Ciudad = v.Cliente.Ciudad,
                            Email = v.Cliente.Email
                        } : new ClienteSimpleDto {
                            Id = 0,
                            Nombre = string.Empty,
                            Documento = string.Empty,
                            Ciudad = string.Empty,
                            Email = string.Empty
                        },
                        DetallesVenta = (v.DetallesVenta ?? Enumerable.Empty<DetalleVenta>()).Select(dv => new DetalleVentaSimpleDto
                        {
                            Id = dv.Id,
                            Cantidad = dv.Cantidad,
                            PrecioUnitario = dv.PrecioUnitario,
                            Subtotal = dv.Subtotal,
                            Producto = dv.Producto != null ? new ProductoSimpleDto
                            {
                                Id = dv.Producto.Id,
                                Nombre = dv.Producto.Nombre,
                                Precio = dv.Producto.Precio
                            } : new ProductoSimpleDto {
                                Id = 0,
                                Nombre = string.Empty,
                                Precio = 0m
                            }
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (venta == null)
                {
                    return NotFound(new { message = "Venta no encontrada" });
                }

                return Ok(venta);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener la venta", error = ex.Message });
            }
        }

        // GET: api/Ventas/cliente/5
        [HttpGet("cliente/{clienteId}")]
        public async Task<ActionResult<IEnumerable<VentaResponseDto>>> GetVentasByCliente(int clienteId)
        {
            try
            {
                var ventasDb = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.DetallesVenta!)
                        .ThenInclude(dv => dv.Producto)
                    .Where(v => v.ClienteId == clienteId)
                    .OrderByDescending(v => v.FechaVenta)
                    .AsNoTracking()
                    .ToListAsync();

                var ventas = ventasDb.Select(v => new VentaResponseDto
                {
                    Id = v.Id,
                    FechaVenta = v.FechaVenta,
                    Subtotal = v.Subtotal,
                    Impuestos = v.Impuestos,
                    Total = v.Total,
                    MetodoPago = v.MetodoPago,
                    Cliente = v.Cliente != null ? new ClienteSimpleDto
                    {
                        Id = v.Cliente.Id,
                        Nombre = v.Cliente.Nombre,
                        Documento = v.Cliente.Documento,
                        Ciudad = v.Cliente.Ciudad,
                        Email = v.Cliente.Email
                    } : new ClienteSimpleDto {
                        Id = 0,
                        Nombre = string.Empty,
                        Documento = string.Empty,
                        Ciudad = string.Empty,
                        Email = string.Empty
                    },
                    DetallesVenta = (v.DetallesVenta ?? new List<DetalleVenta>()).Select(dv => new DetalleVentaSimpleDto
                    {
                        Id = dv.Id,
                        Cantidad = dv.Cantidad,
                        PrecioUnitario = dv.PrecioUnitario,
                        Subtotal = dv.Subtotal,
                        Producto = dv.Producto != null ? new ProductoSimpleDto
                        {
                            Id = dv.Producto.Id,
                            Nombre = dv.Producto.Nombre,
                            Precio = dv.Producto.Precio
                        } : new ProductoSimpleDto {
                            Id = 0,
                            Nombre = string.Empty,
                            Precio = 0m
                        }
                    }).ToList()
                }).ToList();

                return Ok(ventas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener las ventas del cliente", error = ex.Message });
            }
        }

        // GET: api/Ventas/fecha/{fecha}
        [HttpGet("fecha/{fecha}")]
        public async Task<ActionResult<IEnumerable<VentaResponseDto>>> GetVentasByFecha(DateTime fecha)
        {
            try
            {
                var ventasDb = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.DetallesVenta!)
                        .ThenInclude(dv => dv.Producto)
                    .Where(v => v.FechaVenta.Date == fecha.Date)
                    .OrderByDescending(v => v.FechaVenta)
                    .AsNoTracking()
                    .ToListAsync();

                var ventas = ventasDb.Select(v => new VentaResponseDto
                {
                    Id = v.Id,
                    FechaVenta = v.FechaVenta,
                    Subtotal = v.Subtotal,
                    Impuestos = v.Impuestos,
                    Total = v.Total,
                    MetodoPago = v.MetodoPago,
                    Cliente = v.Cliente != null ? new ClienteSimpleDto
                    {
                        Id = v.Cliente.Id,
                        Nombre = v.Cliente.Nombre,
                        Email = v.Cliente.Email
                    } : new ClienteSimpleDto {
                        Id = 0,
                        Nombre = string.Empty,
                        Email = string.Empty
                    },
                    DetallesVenta = (v.DetallesVenta ?? new List<DetalleVenta>()).Select(dv => new DetalleVentaSimpleDto
                    {
                        Id = dv.Id,
                        Cantidad = dv.Cantidad,
                        PrecioUnitario = dv.PrecioUnitario,
                        Subtotal = dv.Subtotal,
                        Producto = dv.Producto != null ? new ProductoSimpleDto
                        {
                            Id = dv.Producto.Id,
                            Nombre = dv.Producto.Nombre,
                            Precio = dv.Producto.Precio
                        } : new ProductoSimpleDto {
                            Id = 0,
                            Nombre = string.Empty,
                            Precio = 0m
                        }
                    }).ToList()
                }).ToList();

                return Ok(ventas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener las ventas por fecha", error = ex.Message });
            }
        }

        // POST: api/Ventas
        [HttpPost]
        public async Task<ActionResult<VentaResponseDto>> PostVenta(VentaCreateInputDto ventaDto)
        {
            try
            {
                Cliente? cliente = null;
                if (ventaDto.UsuarioId.HasValue && ventaDto.UsuarioId.Value > 0)
                {
                    var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == ventaDto.UsuarioId.Value);
                    if (usuario == null)
                    {
                        return BadRequest(new { message = "El usuario especificado no existe" });
                    }

                    var correo = (usuario.Correo ?? string.Empty).ToLower().Trim();
                    cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email.ToLower() == correo);
                    if (cliente == null)
                    {
                        cliente = new Cliente
                        {
                            Nombre = (usuario.Nombres ?? string.Empty).Trim(),
                            Apellido = (usuario.Apellidos ?? string.Empty).Trim(),
                            Email = correo,
                            Documento = "N/A",
                            Telefono = "N/A",
                            Ciudad = "N/A",
                            Activo = true,
                            FechaRegistro = DateTime.UtcNow
                        };
                        _context.Clientes.Add(cliente);
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        var updated = false;
                        if (updated)
                        {
                            cliente.FechaActualizacion = DateTime.UtcNow;
                            await _context.SaveChangesAsync();
                        }
                    }
                    
                }
                else
                {
                    cliente = await _context.Clientes.FindAsync(ventaDto.ClienteId);
                    if (cliente == null)
                    {
                        return BadRequest(new { message = "El cliente especificado no existe" });
                    }
                    var updated = false;
                    if (updated)
                    {
                        cliente.FechaActualizacion = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }

                // Validar que hay detalles de venta
                if (ventaDto.DetallesVenta == null || !ventaDto.DetallesVenta.Any())
                {
                    return BadRequest(new { message = "La venta debe tener al menos un producto" });
                }

                // Crear la venta
                var venta = new Venta
                {
                    ClienteId = cliente!.Id,
                    FechaVenta = ventaDto.FechaVenta ?? DateTime.UtcNow,
                    MetodoPago = ventaDto.MetodoPago ?? "Efectivo",
                    Estado = ventaDto.Estado ?? "Completada",
                    Observaciones = ventaDto.Observaciones,
                    NumeroFactura = GenerarNumeroFactura()
                };

                // Calcular totales y crear detalles
                decimal subtotal = 0;
                var detallesVenta = new List<DetalleVenta>();

                foreach (var detalleDto in ventaDto.DetallesVenta)
                {
                    // Validar que el producto existe
                    var producto = await _context.Productos.FindAsync(detalleDto.ProductoId);
                    if (producto == null)
                    {
                        return BadRequest(new { message = $"El producto con ID {detalleDto.ProductoId} no existe" });
                    }

                    // Validar stock disponible
                    if (producto.Stock < detalleDto.Cantidad)
                    {
                        return BadRequest(new { message = $"Stock insuficiente para el producto {producto.Nombre}. Stock disponible: {producto.Stock}" });
                    }

                    var detalle = new DetalleVenta
                    {
                        ProductoId = detalleDto.ProductoId,
                        Cantidad = detalleDto.Cantidad,
                        PrecioUnitario = detalleDto.PrecioUnitario ?? producto.Precio,
                        Descuento = detalleDto.Descuento,
                        Subtotal = (detalleDto.PrecioUnitario ?? producto.Precio) * detalleDto.Cantidad - detalleDto.Descuento
                    };

                    detallesVenta.Add(detalle);
                    subtotal += detalle.Subtotal;

                    // Actualizar stock del producto
                    producto.Stock -= detalleDto.Cantidad;
                    producto.FechaActualizacion = DateTime.UtcNow;
                }

                // Calcular totales de la venta
                venta.Subtotal = subtotal;
                venta.Impuestos = subtotal * 0.18m; // 18% de impuestos
                venta.Total = venta.Subtotal + venta.Impuestos;
                venta.DetallesVenta = detallesVenta;

                _context.Ventas.Add(venta);
                await _context.SaveChangesAsync();

                // Cargar la venta completa y mapear a DTO en memoria para evitar problemas de traducción EF
                var ventaDb = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.DetallesVenta!)
                        .ThenInclude(dv => dv.Producto)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(v => v.Id == venta.Id);

                if (ventaDb == null)
                {
                    return NotFound(new { message = "Venta no encontrada tras creación" });
                }

                var ventaResponse = new VentaResponseDto
                {
                    Id = ventaDb.Id,
                    FechaVenta = ventaDb.FechaVenta,
                    Subtotal = ventaDb.Subtotal,
                    Impuestos = ventaDb.Impuestos,
                    Total = ventaDb.Total,
                    MetodoPago = ventaDb.MetodoPago,
                    Cliente = ventaDb.Cliente != null ? new ClienteSimpleDto
                    {
                        Id = ventaDb.Cliente.Id,
                        Nombre = ventaDb.Cliente.Nombre,
                        Email = ventaDb.Cliente.Email
                    } : new ClienteSimpleDto {
                        Id = 0,
                        Nombre = string.Empty,
                        Email = string.Empty
                    },
                    DetallesVenta = (ventaDb.DetallesVenta ?? new List<DetalleVenta>()).Select(dv => new DetalleVentaSimpleDto
                    {
                        Id = dv.Id,
                        Cantidad = dv.Cantidad,
                        PrecioUnitario = dv.PrecioUnitario,
                        Subtotal = dv.Subtotal,
                        Producto = dv.Producto != null ? new ProductoSimpleDto
                        {
                            Id = dv.Producto.Id,
                            Nombre = dv.Producto.Nombre,
                            Precio = dv.Producto.Precio
                        } : new ProductoSimpleDto {
                            Id = 0,
                            Nombre = string.Empty,
                            Precio = 0m
                        }
                    }).ToList()
                };

                return CreatedAtAction("GetVenta", new { id = ventaResponse.Id }, ventaResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear la venta", error = ex.Message });
            }
        }

        // PUT: api/Ventas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVenta(int id, VentaUpdateDto ventaDto)
        {
            try
            {
                var venta = await _context.Ventas
                    .Include(v => v.DetallesVenta!)
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (venta == null)
                {
                    return NotFound(new { message = "Venta no encontrada" });
                }

                // Solo permitir actualizar ciertos campos
                if (!string.IsNullOrEmpty(ventaDto.MetodoPago))
                    venta.MetodoPago = ventaDto.MetodoPago;

                if (!string.IsNullOrEmpty(ventaDto.Estado))
                    venta.Estado = ventaDto.Estado;

                if (!string.IsNullOrEmpty(ventaDto.Observaciones))
                    venta.Observaciones = ventaDto.Observaciones;

                venta.FechaActualizacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Venta actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar la venta", error = ex.Message });
            }
        }

        // DELETE: api/Ventas/5 (Anular venta)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVenta(int id)
        {
            try
            {
                var venta = await _context.Ventas
                    .Include(v => v.DetallesVenta!)
                        .ThenInclude(dv => dv.Producto)
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (venta == null)
                {
                    return NotFound(new { message = "Venta no encontrada" });
                }

                if (venta.Estado == "Anulada")
                {
                    return BadRequest(new { message = "La venta ya está anulada" });
                }

                // Restaurar stock de productos
                foreach (var detalle in venta.DetallesVenta!)
                {
                    detalle.Producto!.Stock += detalle.Cantidad;
                    detalle.Producto.FechaActualizacion = DateTime.UtcNow;
                }

                // Anular la venta (soft delete)
                venta.Estado = "Anulada";
                venta.FechaActualizacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Venta anulada correctamente. Stock restaurado." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al anular la venta", error = ex.Message });
            }
        }

        // POST: api/Ventas/{id}/anular (Anular venta con recuperación de stock)
        [HttpPost("{id}/anular")]
        public async Task<IActionResult> AnularVenta(int id)
        {
            try
            {
                var venta = await _context.Ventas
                    .Include(v => v.DetallesVenta!)
                        .ThenInclude(dv => dv.Producto)
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (venta == null)
                {
                    return NotFound(new { message = "Venta no encontrada" });
                }

                if (venta.Estado == "Anulada")
                {
                    return BadRequest(new { message = "La venta ya está anulada" });
                }

                // Restaurar stock de productos
                foreach (var detalle in venta.DetallesVenta!)
                {
                    if (detalle.Producto != null)
                    {
                        detalle.Producto.Stock += detalle.Cantidad;
                        detalle.Producto.FechaActualizacion = DateTime.UtcNow;
                    }
                }

                // Anular la venta (soft delete)
                venta.Estado = "Anulada";
                venta.FechaActualizacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Venta anulada correctamente. Stock restaurado.",
                    ventaId = id,
                    estado = "Anulada"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al anular la venta", error = ex.Message });
            }
        }

        // GET: api/Ventas/estadisticas
        [HttpGet("estadisticas")]
        public async Task<ActionResult> GetEstadisticas()
        {
            try
            {
                var hoy = DateTime.Today;
                var inicioMes = new DateTime(hoy.Year, hoy.Month, 1);

                var estadisticas = new
                {
                    VentasHoy = await _context.Ventas
                        .Where(v => v.FechaVenta.Date == hoy && v.Estado != "Anulada")
                        .CountAsync(),
                    
                    VentasMes = await _context.Ventas
                        .Where(v => v.FechaVenta >= inicioMes && v.Estado != "Anulada")
                        .CountAsync(),
                    
                    TotalVentasHoy = await _context.Ventas
                        .Where(v => v.FechaVenta.Date == hoy && v.Estado != "Anulada")
                        .SumAsync(v => (decimal?)v.Total) ?? 0m,
                    
                    TotalVentasMes = await _context.Ventas
                        .Where(v => v.FechaVenta >= inicioMes && v.Estado != "Anulada")
                        .SumAsync(v => (decimal?)v.Total) ?? 0m,
                    
                    ProductosMasVendidos = await _context.DetallesVenta
                        .Include(dv => dv.Producto)
                        .Where(dv => dv.Venta!.FechaVenta >= inicioMes && dv.Venta.Estado != "Anulada")
                        .GroupBy(dv => new { dv.ProductoId, dv.Producto!.Nombre })
                        .Select(g => new
                        {
                            ProductoId = g.Key.ProductoId,
                            Nombre = g.Key.Nombre,
                            CantidadVendida = g.Sum(dv => dv.Cantidad)
                        })
                        .OrderByDescending(x => x.CantidadVendida)
                        .Take(5)
                        .ToListAsync()
                };

                return Ok(estadisticas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener estadísticas", error = ex.Message });
            }
        }

        private string GenerarNumeroFactura()
        {
            var fecha = DateTime.Now;
            var numero = $"F{fecha:yyyyMMdd}{fecha:HHmmss}";
            return numero;
        }

        private bool VentaExists(int id)
        {
            return _context.Ventas.Any(e => e.Id == id);
        }

        // GET: api/Ventas/estadisticas/serie
        [HttpGet("estadisticas/serie")]
        public async Task<ActionResult> GetSerieVentas([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string groupBy = "day")
        {
            try
            {
                if (from == default || to == default || from > to)
                {
                    return BadRequest(new { message = "Rango de fechas inválido" });
                }
        
                var query = _context.Ventas
                    .Where(v => v.FechaVenta >= from && v.FechaVenta <= to && v.Estado != "Anulada");
        
                if ((groupBy ?? "day").ToLower() == "month")
                {
                    var agrupadoMes = await query
                        .GroupBy(v => new { v.FechaVenta.Year, v.FechaVenta.Month })
                        .Select(g => new
                        {
                            Year = g.Key.Year,
                            Month = g.Key.Month,
                            TotalVentas = g.Count(),
                            TotalMonto = g.Sum(v => (decimal?)v.Total) ?? 0m
                        })
                        .OrderBy(x => x.Year).ThenBy(x => x.Month)
                        .ToListAsync();

                    var serieMes = agrupadoMes
                        .Select(x => new
                        {
                            Label = $"{x.Year}-{x.Month:D2}",
                            x.TotalVentas,
                            x.TotalMonto
                        })
                        .ToList();

                    return Ok(serieMes);
                }
                else
                {
                    var agrupadoDia = await query
                        .GroupBy(v => v.FechaVenta.Date)
                        .Select(g => new
                        {
                            Date = g.Key,
                            TotalVentas = g.Count(),
                            TotalMonto = g.Sum(v => (decimal?)v.Total) ?? 0m
                        })
                        .OrderBy(x => x.Date)
                        .ToListAsync();

                    var serieDia = agrupadoDia
                        .Select(x => new
                        {
                            Label = x.Date.ToString("yyyy-MM-dd"),
                            x.TotalVentas,
                            x.TotalMonto
                        })
                        .ToList();

                    return Ok(serieDia);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener serie de ventas", error = ex.Message });
            }
        }
        
        // GET: api/Ventas/estadisticas/categorias
        [HttpGet("estadisticas/categorias")]
        public async Task<ActionResult> GetVentasPorCategoria([FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            try
            {
                if (from == default || to == default || from > to)
                {
                    return BadRequest(new { message = "Rango de fechas inválido" });
                }
        
                var porCategoria = await _context.DetallesVenta
                    .Include(dv => dv.Producto)!.ThenInclude(p => p!.Categoria)
                    .Where(dv => dv.Venta!.FechaVenta >= from && dv.Venta.FechaVenta <= to && dv.Venta.Estado != "Anulada")
                    .GroupBy(dv => dv.Producto!.Categoria != null ? dv.Producto.Categoria.Nombre : "Sin categoría")
                    .Select(g => new
                    {
                        Categoria = g.Key,
                        CantidadVendida = g.Sum(dv => dv.Cantidad),
                        TotalMonto = g.Sum(dv => dv.Cantidad * dv.PrecioUnitario)
                    })
                    .OrderByDescending(x => x.CantidadVendida)
                    .ToListAsync();
        
                return Ok(porCategoria);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener ventas por categoría", error = ex.Message });
            }
        }

        // GET: api/Ventas/estadisticas/top-productos
        [HttpGet("estadisticas/top-productos")]
        public async Task<ActionResult> GetTopProductos([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int limit = 5)
        {
            try
            {
                if (from == default || to == default || from > to)
                {
                    return BadRequest(new { message = "Rango de fechas inválido" });
                }

                if (limit <= 0 || limit > 50)
                {
                    limit = 5;
                }

                var topProductos = await _context.DetallesVenta
                    .Include(dv => dv.Producto)
                    .Where(dv => dv.Venta!.FechaVenta >= from && dv.Venta.FechaVenta <= to && dv.Venta.Estado != "Anulada")
                    .GroupBy(dv => new { dv.ProductoId, Nombre = dv.Producto!.Nombre })
                    .Select(g => new
                    {
                        ProductoId = g.Key.ProductoId,
                        Nombre = g.Key.Nombre,
                        CantidadVendida = g.Sum(dv => dv.Cantidad),
                        TotalMonto = g.Sum(dv => dv.Cantidad * dv.PrecioUnitario)
                    })
                    .OrderByDescending(x => x.CantidadVendida)
                    .Take(limit)
                    .ToListAsync();

                return Ok(topProductos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener top de productos", error = ex.Message });
            }
        }
    }

    // DTOs para las operaciones
    public class VentaCreateInputDto
    {
        public int ClienteId { get; set; }
        public int? UsuarioId { get; set; }
        public DateTime? FechaVenta { get; set; }
        public string? MetodoPago { get; set; }
        public string? Estado { get; set; }
        public string? Observaciones { get; set; }
        public List<DetalleVentaCreateInputDto> DetallesVenta { get; set; } = new();
    }

    public class DetalleVentaCreateInputDto
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal? PrecioUnitario { get; set; }
        public decimal Descuento { get; set; } = 0;
    }

    public class VentaUpdateDto
    {
        public string? MetodoPago { get; set; }
        public string? Estado { get; set; }
        public string? Observaciones { get; set; }
    }

}
