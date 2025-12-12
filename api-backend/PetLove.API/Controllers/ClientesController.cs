using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.DTOs;
using PetLove.API.Attributes;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public ClientesController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/clientes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClienteResponseDto>>> GetClientes([FromQuery] bool includeInactive = false)
        {
            var clientes = await _context.Clientes
                .Where(c => includeInactive || c.Activo)
                .OrderBy(c => c.Apellido)
                .ThenBy(c => c.Nombre)
                .Select(c => new ClienteResponseDto
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    Apellido = c.Apellido,
                    Email = c.Email,
                    Telefono = c.Telefono,
                    Documento = c.Documento,
                    Direccion = c.Direccion,
                    Ciudad = c.Ciudad,
                    CodigoPostal = c.CodigoPostal,
                    FechaRegistro = c.FechaRegistro,
                    Activo = c.Activo,
                    TotalVentas = c.Ventas != null ? c.Ventas.Count : 0,
                    TotalPedidos = c.Pedidos != null ? c.Pedidos.Count : 0
                })
                .ToListAsync();

            return Ok(clientes);
        }

        // GET: api/clientes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ClienteResponseDto>> GetCliente(int id, [FromQuery] bool includeInactive = false)
        {
            var cliente = await _context.Clientes
                .Where(c => c.Id == id && (includeInactive || c.Activo))
                .Select(c => new ClienteResponseDto
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    Apellido = c.Apellido,
                    Email = c.Email,
                    Telefono = c.Telefono,
                    Documento = c.Documento,
                    Direccion = c.Direccion,
                    Ciudad = c.Ciudad,
                    CodigoPostal = c.CodigoPostal,
                    FechaRegistro = c.FechaRegistro,
                    Activo = c.Activo,
                    TotalVentas = c.Ventas != null ? c.Ventas.Count : 0,
                    TotalPedidos = c.Pedidos != null ? c.Pedidos.Count : 0
                })
                .FirstOrDefaultAsync();

            if (cliente == null)
            {
                return NotFound(new { message = "Cliente no encontrado" });
            }

            return Ok(cliente);
        }

        // POST: api/clientes
        [HttpPost]
        [RequireRole("Administrador", "Asistente")]
        public async Task<ActionResult<ClienteResponseDto>> PostCliente(ClienteCreateDto clienteDto)
        {
            try
            {
                // Validar que el email no exista
                var emailExistente = await _context.Clientes
                    .AnyAsync(c => c.Email.ToLower() == clienteDto.Email.ToLower());

                if (emailExistente)
                {
                    return BadRequest(new { message = "Ya existe un cliente con este email" });
                }

                // Crear el cliente desde el DTO
                var cliente = new Cliente
                {
                    Nombre = clienteDto.Nombre.Trim(),
                    Apellido = clienteDto.Apellido.Trim(),
                    Email = clienteDto.Email.ToLower().Trim(),
                    Telefono = clienteDto.Telefono?.Trim(),
                    Direccion = clienteDto.Direccion?.Trim(),
                    Documento = string.IsNullOrWhiteSpace(clienteDto.Documento) ? null : clienteDto.Documento.Trim(),
                    Ciudad = string.IsNullOrWhiteSpace(clienteDto.Ciudad) ? null : clienteDto.Ciudad.Trim(),
                    CodigoPostal = string.IsNullOrWhiteSpace(clienteDto.CodigoPostal) ? null : clienteDto.CodigoPostal.Trim(),
                    FechaRegistro = DateTime.UtcNow,
                    Activo = true
                };

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();

                // Retornar el DTO de respuesta
                var clienteResponse = new ClienteResponseDto
                {
                    Id = cliente.Id,
                    Nombre = cliente.Nombre,
                    Apellido = cliente.Apellido,
                    Email = cliente.Email,
                    Telefono = cliente.Telefono,
                    Direccion = cliente.Direccion,
                    Documento = cliente.Documento,
                    Ciudad = cliente.Ciudad,
                    CodigoPostal = cliente.CodigoPostal,
                    FechaRegistro = cliente.FechaRegistro,
                    Activo = cliente.Activo,
                    TotalVentas = 0,
                    TotalPedidos = 0
                };

                return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, clienteResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PUT: api/clientes/5
        [HttpPut("{id}")]
        [RequireRole("Administrador", "Asistente")]
        public async Task<IActionResult> PutCliente(int id, ClienteUpdateDto clienteDto)
        {
            try
            {
                var existingCliente = await _context.Clientes.FindAsync(id);
                if (existingCliente == null)
                {
                    return NotFound(new { message = "Cliente no encontrado" });
                }

                // Verificar si el email ya existe en otro cliente (solo si se está actualizando)
                if (!string.IsNullOrEmpty(clienteDto.Email))
                {
                    var emailExistente = await _context.Clientes
                        .AnyAsync(c => c.Email.ToLower() == clienteDto.Email.ToLower() && c.Id != id);

                    if (emailExistente)
                    {
                        return BadRequest(new { message = "Ya existe otro cliente con este email" });
                    }
                }

                // Actualizar solo los campos proporcionados
                if (!string.IsNullOrEmpty(clienteDto.Nombre))
                    existingCliente.Nombre = clienteDto.Nombre.Trim();

                if (!string.IsNullOrEmpty(clienteDto.Apellido))
                    existingCliente.Apellido = clienteDto.Apellido.Trim();

                if (!string.IsNullOrEmpty(clienteDto.Email))
                    existingCliente.Email = clienteDto.Email.ToLower().Trim();

                if (clienteDto.Telefono != null)
                    existingCliente.Telefono = clienteDto.Telefono.Trim();

                if (clienteDto.Direccion != null)
                    existingCliente.Direccion = clienteDto.Direccion.Trim();

                if (clienteDto.Documento != null)
                    existingCliente.Documento = string.IsNullOrWhiteSpace(clienteDto.Documento) ? null : clienteDto.Documento.Trim();

                if (clienteDto.Ciudad != null)
                    existingCliente.Ciudad = string.IsNullOrWhiteSpace(clienteDto.Ciudad) ? null : clienteDto.Ciudad.Trim();

                if (clienteDto.CodigoPostal != null)
                    existingCliente.CodigoPostal = string.IsNullOrWhiteSpace(clienteDto.CodigoPostal) ? null : clienteDto.CodigoPostal.Trim();

                if (clienteDto.Activo.HasValue)
                    existingCliente.Activo = clienteDto.Activo.Value;

                existingCliente.FechaActualizacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Cliente actualizado correctamente" });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClienteExists(id))
                {
                    return NotFound(new { message = "Cliente no encontrado" });
                }
                else
                {
                    return StatusCode(500, new { message = "Error de concurrencia al actualizar el cliente" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // DELETE: api/clientes/5
        [HttpDelete("{id}")]
        [RequireRole("Administrador", "Asistente")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            try
            {
                var cliente = await _context.Clientes.FindAsync(id);
                if (cliente == null)
                {
                    return NotFound(new { message = "Cliente no encontrado" });
                }

                // Si el cliente tiene pedidos o ventas relacionadas, realizar eliminación lógica
                var tienePedidos = await _context.Pedidos.AnyAsync(p => p.ClienteId == id);
                var tieneVentas = await _context.Ventas.AnyAsync(v => v.ClienteId == id);

                if (tienePedidos || tieneVentas)
                {
                    // Eliminación lógica: marcar inactivo y anonimizar campos opcionales
                    cliente.Activo = false;
                    cliente.Nombre = cliente.Nombre.Trim();
                    cliente.Apellido = cliente.Apellido.Trim();
                    cliente.Email = cliente.Email.Trim();
                    cliente.Telefono = null;
                    cliente.Direccion = null;
                    cliente.Ciudad = null;
                    cliente.Documento = null;
                    cliente.CodigoPostal = null;
                    cliente.FechaActualizacion = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Cliente marcado como inactivo (referencias existentes en pedidos/ventas)" });
                }
                else
                {
                    // Eliminación permanente de la base de datos
                    _context.Clientes.Remove(cliente);
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Cliente eliminado correctamente" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/clientes/buscar/{termino}
        [HttpGet("buscar/{termino}")]
        public async Task<ActionResult<IEnumerable<ClienteResponseDto>>> BuscarClientes(string termino)
        {
            var clientes = await _context.Clientes
                .Where(c => c.Activo && 
                            (c.Nombre.Contains(termino) || 
                             c.Apellido.Contains(termino) ||
                             c.Email.Contains(termino)))
                .OrderBy(c => c.Apellido)
                .ThenBy(c => c.Nombre)
                .Select(c => new ClienteResponseDto
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    Apellido = c.Apellido,
                    Email = c.Email,
                    Telefono = c.Telefono,
                    Documento = c.Documento,
                    Direccion = c.Direccion,
                    Ciudad = c.Ciudad,
                    CodigoPostal = c.CodigoPostal,
                    FechaRegistro = c.FechaRegistro,
                    Activo = c.Activo,
                    TotalVentas = c.Ventas != null ? c.Ventas.Count : 0,
                    TotalPedidos = c.Pedidos != null ? c.Pedidos.Count : 0
                })
                .ToListAsync();

            return Ok(clientes);
        }

        // PUT: api/clientes/{id}/contacto
        [HttpPut("{id}/contacto")]
        [RequireCliente]
        public async Task<IActionResult> PutClienteContacto(int id, ClienteContactoUpdateDto contactoDto)
        {
            var existingCliente = await _context.Clientes.FindAsync(id);
            if (existingCliente == null)
            {
                return NotFound(new { message = "Cliente no encontrado" });
            }

            var updated = false;
            if (contactoDto.Documento != null)
            {
                existingCliente.Documento = string.IsNullOrWhiteSpace(contactoDto.Documento) ? existingCliente.Documento : contactoDto.Documento.Trim();
                updated = true;
            }
            if (contactoDto.Telefono != null)
            {
                existingCliente.Telefono = string.IsNullOrWhiteSpace(contactoDto.Telefono) ? existingCliente.Telefono : contactoDto.Telefono.Trim();
                updated = true;
            }
            if (contactoDto.Ciudad != null)
            {
                existingCliente.Ciudad = string.IsNullOrWhiteSpace(contactoDto.Ciudad) ? existingCliente.Ciudad : contactoDto.Ciudad.Trim();
                updated = true;
            }

            if (updated)
            {
                existingCliente.FechaActualizacion = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Contacto del cliente actualizado" });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<ClienteResponseDto>> GetMe()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrWhiteSpace(email))
            {
                return Unauthorized(new { message = "No se pudo determinar el correo del usuario" });
            }

            var correo = email.ToLower().Trim();
            var cliente = await _context.Clientes
                .Where(c => c.Email.ToLower() == correo)
                .Select(c => new ClienteResponseDto
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    Apellido = c.Apellido,
                    Email = c.Email,
                    Telefono = c.Telefono,
                    Documento = c.Documento,
                    Direccion = c.Direccion,
                    Ciudad = c.Ciudad,
                    CodigoPostal = c.CodigoPostal,
                    FechaRegistro = c.FechaRegistro,
                    Activo = c.Activo,
                    TotalVentas = c.Ventas != null ? c.Ventas.Count : 0,
                    TotalPedidos = c.Pedidos != null ? c.Pedidos.Count : 0
                })
                .FirstOrDefaultAsync();

            if (cliente == null)
            {
                var nuevo = new Cliente
                {
                    Nombre = string.Empty,
                    Apellido = string.Empty,
                    Email = correo,
                    Activo = true,
                    FechaRegistro = DateTime.UtcNow
                };
                _context.Clientes.Add(nuevo);
                await _context.SaveChangesAsync();

                cliente = new ClienteResponseDto
                {
                    Id = nuevo.Id,
                    Nombre = nuevo.Nombre,
                    Apellido = nuevo.Apellido,
                    Email = nuevo.Email,
                    Telefono = nuevo.Telefono,
                    Documento = nuevo.Documento,
                    Direccion = nuevo.Direccion,
                    Ciudad = nuevo.Ciudad,
                    CodigoPostal = nuevo.CodigoPostal,
                    FechaRegistro = nuevo.FechaRegistro,
                    Activo = nuevo.Activo,
                    TotalVentas = 0,
                    TotalPedidos = 0
                };
            }

            return Ok(cliente);
        }

        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> UpdateMe([FromBody] ClienteUpdateDto clienteDto)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrWhiteSpace(email))
            {
                return Unauthorized(new { message = "No se pudo determinar el correo del usuario" });
            }

            var correo = email.ToLower().Trim();
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email.ToLower() == correo);
            if (cliente == null)
            {
                cliente = new Cliente
                {
                    Nombre = string.Empty,
                    Apellido = string.Empty,
                    Email = correo,
                    Activo = true,
                    FechaRegistro = DateTime.UtcNow
                };
                _context.Clientes.Add(cliente);
            }

            if (!string.IsNullOrEmpty(clienteDto.Nombre)) cliente.Nombre = clienteDto.Nombre.Trim();
            if (!string.IsNullOrEmpty(clienteDto.Apellido)) cliente.Apellido = clienteDto.Apellido.Trim();
            if (clienteDto.Telefono != null) cliente.Telefono = clienteDto.Telefono.Trim();
            if (clienteDto.Direccion != null) cliente.Direccion = clienteDto.Direccion.Trim();
            if (clienteDto.Documento != null) cliente.Documento = string.IsNullOrWhiteSpace(clienteDto.Documento) ? null : clienteDto.Documento.Trim();
            if (clienteDto.Ciudad != null) cliente.Ciudad = string.IsNullOrWhiteSpace(clienteDto.Ciudad) ? null : clienteDto.Ciudad.Trim();
            if (clienteDto.CodigoPostal != null) cliente.CodigoPostal = string.IsNullOrWhiteSpace(clienteDto.CodigoPostal) ? null : clienteDto.CodigoPostal.Trim();
            if (clienteDto.Activo.HasValue) cliente.Activo = clienteDto.Activo.Value;
            cliente.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Perfil de cliente actualizado" });
        }

        [HttpGet("me/pedidos")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Pedido>>> GetMisPedidos()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrWhiteSpace(email))
            {
                return Unauthorized(new { message = "No se pudo determinar el correo del usuario" });
            }

            var correo = email.ToLower().Trim();
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email.ToLower() == correo);
            if (cliente == null)
            {
                return Ok(new List<Pedido>());
            }

            var pedidos = await _context.Pedidos
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .Where(p => p.ClienteId == cliente.Id)
                .OrderByDescending(p => p.FechaPedido)
                .ToListAsync();

            return Ok(pedidos);
        }

        [HttpPost("me/pedidos")]
        [Authorize]
        public async Task<ActionResult<Pedido>> CrearPedidoParaMiCuenta([FromBody] CreatePedidoDto pedidoDto)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrWhiteSpace(email))
            {
                return Unauthorized(new { message = "No se pudo determinar el correo del usuario" });
            }
            var correo = email.ToLower().Trim();
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email.ToLower() == correo);
            if (cliente == null || !cliente.Activo)
            {
                return Unauthorized(new { message = "Cliente no encontrado o inactivo" });
            }
            if (pedidoDto.DetallesPedido == null || !pedidoDto.DetallesPedido.Any())
            {
                return BadRequest(new { message = "El pedido debe incluir al menos un producto" });
            }
            var pedido = new Pedido
            {
                ClienteId = cliente.Id,
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
            pedido.DetallesPedido = new List<DetallePedido>();
            foreach (var d in pedidoDto.DetallesPedido)
            {
                var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == d.ProductoId);
                if (producto == null || !producto.Activo)
                {
                    return BadRequest(new { message = $"Producto no válido: {d.ProductoId}" });
                }
                var detalle = new DetallePedido
                {
                    ProductoId = d.ProductoId,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    Descuento = d.Descuento,
                    Subtotal = d.Subtotal,
                    Producto = producto
                };
                pedido.DetallesPedido.Add(detalle);
            }
            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();
            return Ok(pedido);
        }

        private bool ClienteExists(int id)
        {
            return _context.Clientes.Any(e => e.Id == id);
        }

        // Método auxiliar para validar email
        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
