using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PedidosController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public PedidosController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/pedidos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidos()
        {
            return await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .OrderByDescending(p => p.FechaPedido)
                .ToListAsync();
        }

        // GET: api/pedidos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Pedido>> GetPedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                return NotFound();
            }

            return pedido;
        }

        // POST: api/pedidos
        [HttpPost]
        public async Task<ActionResult<Pedido>> PostPedido(CreatePedidoDto pedidoDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Verificar que el cliente existe
            var cliente = await _context.Clientes.FindAsync(pedidoDto.ClienteId);
            if (cliente == null || !cliente.Activo)
            {
                return BadRequest("El cliente especificado no existe o está inactivo.");
            }

            // Crear el pedido desde el DTO
            var pedido = new Pedido
            {
                ClienteId = pedidoDto.ClienteId,
                FechaPedido = DateTime.UtcNow,
                Estado = "Pendiente",
                Subtotal = pedidoDto.Subtotal,
                CostoEnvio = pedidoDto.CostoEnvio,
                Impuestos = pedidoDto.Impuestos,
                Total = pedidoDto.Total,
                DireccionEntrega = pedidoDto.DireccionEntrega,
                CiudadEntrega = pedidoDto.CiudadEntrega,
                CodigoPostalEntrega = pedidoDto.CodigoPostalEntrega,
                TelefonoContacto = pedidoDto.TelefonoContacto,
                Observaciones = pedidoDto.Observaciones
            };

            // Validar y procesar detalles del pedido
            if (pedidoDto.DetallesPedido != null && pedidoDto.DetallesPedido.Any())
            {
                pedido.DetallesPedido = new List<DetallePedido>();
                
                foreach (var detalleDto in pedidoDto.DetallesPedido)
                {
                    var producto = await _context.Productos.FindAsync(detalleDto.ProductoId);
                    if (producto == null || !producto.Activo)
                    {
                        return BadRequest($"El producto con ID {detalleDto.ProductoId} no existe o está inactivo.");
                    }

                    // Verificar stock disponible
                    if (producto.Stock < detalleDto.Cantidad)
                    {
                        return BadRequest($"Stock insuficiente para el producto {producto.Nombre}. Stock disponible: {producto.Stock}");
                    }

                    // Crear detalle del pedido
                    var detalle = new DetallePedido
                    {
                        ProductoId = detalleDto.ProductoId,
                        Cantidad = detalleDto.Cantidad,
                        PrecioUnitario = detalleDto.PrecioUnitario,
                        Descuento = detalleDto.Descuento,
                        Subtotal = detalleDto.Cantidad * detalleDto.PrecioUnitario - detalleDto.Descuento
                    };
                    
                    pedido.DetallesPedido.Add(detalle);
                }
            }
            
            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
        }

        // PUT: api/pedidos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPedido(int id, Pedido pedido)
        {
            if (id != pedido.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingPedido = await _context.Pedidos
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (existingPedido == null)
            {
                return NotFound();
            }

            // Si el pedido se confirma, reducir stock
            if (existingPedido.Estado != "Confirmado" && pedido.Estado == "Confirmado")
            {
                foreach (var detalle in existingPedido.DetallesPedido ?? Enumerable.Empty<DetallePedido>())
                {
                    if (detalle.Producto != null)
                    {
                        if (detalle.Producto.Stock < detalle.Cantidad)
                        {
                            return BadRequest($"Stock insuficiente para el producto {detalle.Producto.Nombre}");
                        }
                        detalle.Producto.Stock -= detalle.Cantidad;
                        detalle.Producto.FechaActualizacion = DateTime.UtcNow;
                    }
                }
            }

            // Si el pedido se cancela después de estar confirmado, restaurar stock
            if (existingPedido.Estado == "Confirmado" && pedido.Estado == "Cancelado")
            {
                foreach (var detalle in existingPedido.DetallesPedido ?? Enumerable.Empty<DetallePedido>())
                {
                    if (detalle.Producto != null)
                    {
                        detalle.Producto.Stock += detalle.Cantidad;
                        detalle.Producto.FechaActualizacion = DateTime.UtcNow;
                    }
                }
            }

            // Actualizar propiedades
            existingPedido.Estado = pedido.Estado;
            existingPedido.FechaEntrega = pedido.FechaEntrega;
            existingPedido.Observaciones = pedido.Observaciones;
            existingPedido.FechaActualizacion = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PedidoExists(id))
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

        // DELETE: api/pedidos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                return NotFound();
            }

            // Si el pedido estaba confirmado, restaurar stock
            if (pedido.Estado == "Confirmado" && pedido.DetallesPedido != null)
            {
                foreach (var detalle in pedido.DetallesPedido)
                {
                    if (detalle.Producto != null)
                    {
                        detalle.Producto.Stock += detalle.Cantidad;
                        detalle.Producto.FechaActualizacion = DateTime.UtcNow;
                    }
                }
            }

            _context.Pedidos.Remove(pedido);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/pedidos/cliente/{clienteId}
        [HttpGet("cliente/{clienteId}")]
        public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidosPorCliente(int clienteId)
        {
            return await _context.Pedidos
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .Where(p => p.ClienteId == clienteId)
                .OrderByDescending(p => p.FechaPedido)
                .ToListAsync();
        }

        // GET: api/pedidos/estado/{estado}
        [HttpGet("estado/{estado}")]
        public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidosPorEstado(string estado)
        {
            return await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .Where(p => p.Estado == estado)
                .OrderByDescending(p => p.FechaPedido)
                .ToListAsync();
        }

        [HttpPost("{id}/confirmar")]
        public async Task<ActionResult<Venta>> ConfirmarPedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (pedido == null)
            {
                return NotFound();
            }
            if (pedido.DetallesPedido == null || pedido.DetallesPedido.Count == 0)
            {
                return BadRequest("El pedido no tiene detalles");
            }
            decimal subtotal = 0;
            foreach (var detalle in pedido.DetallesPedido)
            {
                if (detalle.Producto == null)
                {
                    var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                    if (producto == null || !producto.Activo)
                    {
                        return BadRequest($"Producto no válido: {detalle.ProductoId}");
                    }
                    detalle.Producto = producto;
                }
                if (detalle.Producto.Stock < detalle.Cantidad)
                {
                    return BadRequest($"Stock insuficiente para el producto {detalle.Producto.Nombre}");
                }
                subtotal += detalle.Subtotal;
            }
            var venta = new Venta
            {
                ClienteId = pedido.ClienteId,
                FechaVenta = DateTime.UtcNow,
                MetodoPago = "Efectivo",
                Estado = "Completada",
                Observaciones = pedido.Observaciones
            };
            var detallesVenta = new List<DetalleVenta>();
            foreach (var detalle in pedido.DetallesPedido)
            {
                var dv = new DetalleVenta
                {
                    ProductoId = detalle.ProductoId,
                    Cantidad = detalle.Cantidad,
                    PrecioUnitario = detalle.PrecioUnitario,
                    Descuento = detalle.Descuento,
                    Subtotal = detalle.Subtotal
                };
                detallesVenta.Add(dv);
                detalle.Producto.Stock -= detalle.Cantidad;
                detalle.Producto.FechaActualizacion = DateTime.UtcNow;
            }
            venta.Subtotal = subtotal;
            venta.Impuestos = subtotal * 0.18m;
            venta.Total = venta.Subtotal + venta.Impuestos;
            venta.DetallesVenta = detallesVenta;
            _context.Ventas.Add(venta);
            pedido.Estado = "Confirmado";
            await _context.SaveChangesAsync();
            return Ok(venta);
        }

        // PUT: api/pedidos/5/estado
        [HttpPut("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoPedido(int id, [FromBody] string nuevoEstado)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                return NotFound();
            }

            var estadoAnterior = pedido.Estado;
            pedido.Estado = nuevoEstado;
            pedido.FechaActualizacion = DateTime.UtcNow;

            // Manejar cambios de stock según el estado
            if (estadoAnterior != "Confirmado" && nuevoEstado == "Confirmado")
            {
                // Confirmar pedido: reducir stock
                foreach (var detalle in pedido.DetallesPedido!)
                {
                    if (detalle.Producto != null)
                    {
                        if (detalle.Producto.Stock < detalle.Cantidad)
                        {
                            return BadRequest($"Stock insuficiente para el producto {detalle.Producto.Nombre}");
                        }
                        detalle.Producto.Stock -= detalle.Cantidad;
                        detalle.Producto.FechaActualizacion = DateTime.UtcNow;
                    }
                }
            }
            else if (estadoAnterior == "Confirmado" && nuevoEstado == "Cancelado")
            {
                // Cancelar pedido confirmado: restaurar stock
                foreach (var detalle in pedido.DetallesPedido!)
                {
                    if (detalle.Producto != null)
                    {
                        detalle.Producto.Stock += detalle.Cantidad;
                        detalle.Producto.FechaActualizacion = DateTime.UtcNow;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool PedidoExists(int id)
        {
            return _context.Pedidos.Any(e => e.Id == id);
        }
    }

    // DTOs para evitar problemas de serialización
    public class CreatePedidoDto
    {
        public int ClienteId { get; set; }
        public DateTime FechaPedido { get; set; } = DateTime.UtcNow;
        public string Estado { get; set; } = "Pendiente";
        public decimal Subtotal { get; set; }
        public decimal CostoEnvio { get; set; } = 0;
        public decimal Impuestos { get; set; }
        public decimal Total { get; set; }
        public string? DireccionEntrega { get; set; }
        public string? CiudadEntrega { get; set; }
        public string? CodigoPostalEntrega { get; set; }
        public string? TelefonoContacto { get; set; }
        public string? Observaciones { get; set; }
        public List<CreateDetallePedidoDto>? DetallesPedido { get; set; }
    }

    public class CreateDetallePedidoDto
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Descuento { get; set; } = 0;
        public decimal Subtotal { get; set; }
    }
}
