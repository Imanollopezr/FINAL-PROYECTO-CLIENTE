using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.API.DTOs;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;
using System.Security.Claims;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CarritoController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public CarritoController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/carrito
        [HttpGet]
        public async Task<ActionResult<CarritoResponseDto>> GetCarrito()
        {
            try
            {
                var usuarioId = GetUsuarioId();
                if (usuarioId == null)
                {
                    return Unauthorized(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Usuario no autenticado"
                    });
                }

                var carrito = await _context.Carritos
                    .Include(c => c.Items)
                        .ThenInclude(i => i.Producto)
                    .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId && c.Activo);

                if (carrito == null)
                {
                    // Crear carrito vacío si no existe
                    carrito = new Carrito
                    {
                        UsuarioId = usuarioId.Value,
                        FechaCreacion = DateTime.UtcNow,
                        Activo = true
                    };
                    _context.Carritos.Add(carrito);
                    await _context.SaveChangesAsync();
                }

                var carritoDto = MapearCarritoADto(carrito);

                return Ok(new CarritoResponseDto
                {
                    Success = true,
                    Message = "Carrito obtenido exitosamente",
                    Data = carritoDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CarritoResponseDto
                {
                    Success = false,
                    Message = $"Error interno del servidor: {ex.Message}"
                });
            }
        }

        // POST: api/carrito/items
        [HttpPost("items")]
        public async Task<ActionResult<CarritoResponseDto>> AgregarItem([FromBody] AgregarItemCarritoDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Datos inválidos"
                    });
                }

                var usuarioId = GetUsuarioId();
                if (usuarioId == null)
                {
                    return Unauthorized(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Usuario no autenticado"
                    });
                }

                // Verificar que el producto existe y está activo
                var producto = await _context.Productos.FindAsync(dto.ProductoId);
                if (producto == null || !producto.Activo)
                {
                    return BadRequest(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Producto no encontrado o inactivo"
                    });
                }

                // Verificar stock disponible
                if (producto.Stock < dto.Cantidad)
                {
                    return BadRequest(new CarritoResponseDto
                    {
                        Success = false,
                        Message = $"Stock insuficiente. Solo hay {producto.Stock} unidades disponibles"
                    });
                }

                // Obtener o crear carrito
                var carrito = await _context.Carritos
                    .Include(c => c.Items)
                    .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId && c.Activo);

                if (carrito == null)
                {
                    carrito = new Carrito
                    {
                        UsuarioId = usuarioId.Value,
                        FechaCreacion = DateTime.UtcNow,
                        Activo = true
                    };
                    _context.Carritos.Add(carrito);
                    await _context.SaveChangesAsync();
                }

                // Verificar si el producto ya está en el carrito
                var itemExistente = carrito.Items.FirstOrDefault(i => i.ProductoId == dto.ProductoId);
                if (itemExistente != null)
                {
                    // Actualizar cantidad
                    var nuevaCantidad = itemExistente.Cantidad + dto.Cantidad;
                    if (nuevaCantidad > producto.Stock)
                    {
                        return BadRequest(new CarritoResponseDto
                        {
                            Success = false,
                            Message = $"No se puede agregar más cantidad. Stock disponible: {producto.Stock}"
                        });
                    }
                    
                    itemExistente.Cantidad = nuevaCantidad;
                    itemExistente.FechaActualizacion = DateTime.UtcNow;
                }
                else
                {
                    // Agregar nuevo item
                    var nuevoItem = new CarritoItem
                    {
                        CarritoId = carrito.Id,
                        ProductoId = dto.ProductoId,
                        Cantidad = dto.Cantidad,
                        PrecioUnitario = producto.Precio,
                        FechaAgregado = DateTime.UtcNow
                    };
                    _context.CarritoItems.Add(nuevoItem);
                }

                carrito.FechaActualizacion = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Recargar carrito con datos actualizados
                carrito = await _context.Carritos
                    .Include(c => c.Items)
                        .ThenInclude(i => i.Producto)
                    .FirstOrDefaultAsync(c => c.Id == carrito.Id);

                var carritoDto = MapearCarritoADto(carrito!);

                return Ok(new CarritoResponseDto
                {
                    Success = true,
                    Message = "Producto agregado al carrito exitosamente",
                    Data = carritoDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CarritoResponseDto
                {
                    Success = false,
                    Message = $"Error interno del servidor: {ex.Message}"
                });
            }
        }

        // PUT: api/carrito/items/{itemId}
        [HttpPut("items/{itemId}")]
        public async Task<ActionResult<CarritoResponseDto>> ActualizarItem(int itemId, [FromBody] ActualizarItemCarritoDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Datos inválidos"
                    });
                }

                var usuarioId = GetUsuarioId();
                if (usuarioId == null)
                {
                    return Unauthorized(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Usuario no autenticado"
                    });
                }

                var item = await _context.CarritoItems
                    .Include(i => i.Carrito)
                    .Include(i => i.Producto)
                    .FirstOrDefaultAsync(i => i.Id == itemId && i.Carrito.UsuarioId == usuarioId);

                if (item == null)
                {
                    return NotFound(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Item no encontrado en el carrito"
                    });
                }

                // Verificar stock disponible
                if (item.Producto.Stock < dto.Cantidad)
                {
                    return BadRequest(new CarritoResponseDto
                    {
                        Success = false,
                        Message = $"Stock insuficiente. Solo hay {item.Producto.Stock} unidades disponibles"
                    });
                }

                item.Cantidad = dto.Cantidad;
                item.FechaActualizacion = DateTime.UtcNow;
                item.Carrito.FechaActualizacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Recargar carrito con datos actualizados
                var carrito = await _context.Carritos
                    .Include(c => c.Items)
                        .ThenInclude(i => i.Producto)
                    .FirstOrDefaultAsync(c => c.Id == item.CarritoId);

                var carritoDto = MapearCarritoADto(carrito!);

                return Ok(new CarritoResponseDto
                {
                    Success = true,
                    Message = "Item actualizado exitosamente",
                    Data = carritoDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CarritoResponseDto
                {
                    Success = false,
                    Message = $"Error interno del servidor: {ex.Message}"
                });
            }
        }

        // DELETE: api/carrito/items/{itemId}
        [HttpDelete("items/{itemId}")]
        public async Task<ActionResult<CarritoResponseDto>> EliminarItem(int itemId)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                if (usuarioId == null)
                {
                    return Unauthorized(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Usuario no autenticado"
                    });
                }

                var item = await _context.CarritoItems
                    .Include(i => i.Carrito)
                    .FirstOrDefaultAsync(i => i.Id == itemId && i.Carrito.UsuarioId == usuarioId);

                if (item == null)
                {
                    return NotFound(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Item no encontrado en el carrito"
                    });
                }

                _context.CarritoItems.Remove(item);
                item.Carrito.FechaActualizacion = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Recargar carrito con datos actualizados
                var carrito = await _context.Carritos
                    .Include(c => c.Items)
                        .ThenInclude(i => i.Producto)
                    .FirstOrDefaultAsync(c => c.Id == item.CarritoId);

                var carritoDto = MapearCarritoADto(carrito!);

                return Ok(new CarritoResponseDto
                {
                    Success = true,
                    Message = "Item eliminado del carrito exitosamente",
                    Data = carritoDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CarritoResponseDto
                {
                    Success = false,
                    Message = $"Error interno del servidor: {ex.Message}"
                });
            }
        }

        // DELETE: api/carrito
        [HttpDelete]
        public async Task<ActionResult<CarritoResponseDto>> VaciarCarrito()
        {
            try
            {
                var usuarioId = GetUsuarioId();
                if (usuarioId == null)
                {
                    return Unauthorized(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Usuario no autenticado"
                    });
                }

                var carrito = await _context.Carritos
                    .Include(c => c.Items)
                    .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId && c.Activo);

                if (carrito == null)
                {
                    return NotFound(new CarritoResponseDto
                    {
                        Success = false,
                        Message = "Carrito no encontrado"
                    });
                }

                _context.CarritoItems.RemoveRange(carrito.Items);
                carrito.FechaActualizacion = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var carritoDto = MapearCarritoADto(carrito);

                return Ok(new CarritoResponseDto
                {
                    Success = true,
                    Message = "Carrito vaciado exitosamente",
                    Data = carritoDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CarritoResponseDto
                {
                    Success = false,
                    Message = $"Error interno del servidor: {ex.Message}"
                });
            }
        }

        // POST: api/carrito/procesar-compra
        [HttpPost("procesar-compra")]
        public async Task<ActionResult<ProcesarCompraResponseDto>> ProcesarCompra([FromBody] ProcesarCompraDto dto)
        {
            return await ProcesarCompraInterno(dto);
        }

        private async Task<ActionResult<ProcesarCompraResponseDto>> ProcesarCompraInterno(ProcesarCompraDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ProcesarCompraResponseDto
                {
                    Success = false,
                    Message = "Datos inválidos"
                });
            }

            var usuarioId = GetUsuarioId();
            if (usuarioId == null)
            {
                return Unauthorized(new ProcesarCompraResponseDto
                {
                    Success = false,
                    Message = "Usuario no autenticado"
                });
            }

            var metodoPagoNormalizado = (dto.MetodoPago ?? "Efectivo").Trim();
            if (metodoPagoNormalizado != "Efectivo" && metodoPagoNormalizado != "Transferencia")
            {
                return BadRequest(new ProcesarCompraResponseDto
                {
                    Success = false,
                    Message = "Método de pago no permitido. Use 'Transferencia' o 'Efectivo'."
                });
            }

            string metodoPagoFinal = metodoPagoNormalizado;
            if (metodoPagoNormalizado == "Transferencia")
            {
                var metodoTransferencia = (dto.MetodoTransferencia ?? string.Empty).Trim();
                if (metodoTransferencia != "Nequi" && metodoTransferencia != "Bancolombia")
                {
                    return BadRequest(new ProcesarCompraResponseDto
                    {
                        Success = false,
                        Message = "Para transferencia, seleccione 'Nequi' o 'Bancolombia'."
                    });
                }
                metodoPagoFinal = $"Transferencia - {metodoTransferencia}";
            }

            var carrito = await _context.Carritos
                .Include(c => c.Items)
                    .ThenInclude(i => i.Producto)
                .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId && c.Activo);

            if (carrito == null || !carrito.Items.Any())
            {
                return BadRequest(new ProcesarCompraResponseDto
                {
                    Success = false,
                    Message = "El carrito está vacío"
                });
            }

            var usuario = await _context.Usuarios.FindAsync(usuarioId.Value);
            if (usuario == null)
            {
                return BadRequest(new ProcesarCompraResponseDto
                {
                    Success = false,
                    Message = "Usuario no encontrado"
                });
            }

            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c => c.Email == usuario.Correo);

            if (cliente == null)
            {
                cliente = new Cliente
                {
                    Nombre = usuario.Nombres,
                    Apellido = usuario.Apellidos,
                    Email = usuario.Correo,
                    Telefono = dto.Telefono,
                    Direccion = dto.Direccion,
                    Ciudad = dto.Ciudad,
                    CodigoPostal = dto.CodigoPostal,
                    Documento = dto.Documento,
                    TipoDocumentoIdTipoDocumento = dto.TipoDocumentoId,
                    Activo = true,
                    FechaRegistro = DateTime.UtcNow
                };
                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();
            }
            else
            {
                if (!string.IsNullOrEmpty(dto.Telefono)) cliente.Telefono = dto.Telefono;
                if (!string.IsNullOrEmpty(dto.Direccion)) cliente.Direccion = dto.Direccion;
                if (!string.IsNullOrEmpty(dto.Ciudad)) cliente.Ciudad = dto.Ciudad;
                if (!string.IsNullOrEmpty(dto.CodigoPostal)) cliente.CodigoPostal = dto.CodigoPostal;
                if (!string.IsNullOrEmpty(dto.Documento)) cliente.Documento = dto.Documento;
                if (dto.TipoDocumentoId.HasValue) cliente.TipoDocumentoIdTipoDocumento = dto.TipoDocumentoId;
                cliente.FechaActualizacion = DateTime.UtcNow;
            }

            var detallesVenta = new List<DetalleVenta>();
            decimal subtotal = 0;
            foreach (var item in carrito.Items)
            {
                if (item.Producto!.Stock < item.Cantidad)
                {
                    return BadRequest(new ProcesarCompraResponseDto
                    {
                        Success = false,
                        Message = $"Stock insuficiente para {item.Producto.Nombre}. Disponible: {item.Producto.Stock}"
                    });
                }

                var detalle = new DetalleVenta
                {
                    ProductoId = item.ProductoId,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = item.PrecioUnitario,
                    Descuento = 0,
                    Subtotal = item.Subtotal
                };
                detallesVenta.Add(detalle);
                subtotal += item.Subtotal;

                item.Producto.Stock -= item.Cantidad;
                item.Producto.FechaActualizacion = DateTime.UtcNow;
            }

            var venta = new Venta
            {
                ClienteId = cliente.Id,
                FechaVenta = DateTime.UtcNow,
                MetodoPago = metodoPagoFinal,
                Estado = "Completada",
                Observaciones = dto.Observaciones,
                NumeroFactura = GenerarNumeroFactura(),
                Subtotal = subtotal,
                Impuestos = subtotal * 0.18m,
                DetallesVenta = detallesVenta
            };
            venta.Total = venta.Subtotal + venta.Impuestos;

            _context.Ventas.Add(venta);
            _context.CarritoItems.RemoveRange(carrito.Items);
            carrito.FechaActualizacion = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ProcesarCompraResponseDto
            {
                Success = true,
                Message = cliente.FechaRegistro.Date == DateTime.UtcNow.Date
                    ? "¡Compra procesada exitosamente! Te has convertido en cliente de PetLove."
                    : "Compra procesada exitosamente",
                VentaId = venta.Id,
                NumeroFactura = venta.NumeroFactura,
                Total = venta.Total,
                EsNuevoCliente = cliente.FechaRegistro.Date == DateTime.UtcNow.Date
            });
        }

        private int? GetUsuarioId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }

        private string GenerarNumeroFactura()
        {
            var fecha = DateTime.Now;
            var numero = $"F{fecha:yyyyMMdd}{fecha:HHmmss}";
            return numero;
        }

        private static CarritoDto MapearCarritoADto(Carrito carrito)
        {
            return new CarritoDto
            {
                Id = carrito.Id,
                UsuarioId = carrito.UsuarioId,
                FechaCreacion = carrito.FechaCreacion,
                FechaActualizacion = carrito.FechaActualizacion,
                Items = carrito.Items.Select(i => new CarritoItemDto
                {
                    Id = i.Id,
                    CarritoId = i.CarritoId,
                    ProductoId = i.ProductoId,
                    ProductoNombre = i.Producto?.Nombre ?? string.Empty,
                    ProductoImagen = i.Producto?.ImagenUrl,
                    Cantidad = i.Cantidad,
                    PrecioUnitario = i.PrecioUnitario,
                    Subtotal = i.Subtotal,
                    FechaAgregado = i.FechaAgregado
                }).ToList()
            };
        }
    }
}
