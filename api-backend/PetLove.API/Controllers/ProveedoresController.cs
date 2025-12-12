using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.DTOs;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public ProveedoresController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/proveedores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProveedorResponseDto>>> GetProveedores()
        {
            var proveedores = await _context.Proveedores
                .Include(p => p.TipoDocumento)
                .Where(p => p.Activo)
                .Select(p => new ProveedorResponseDto
                {
                    Id = p.Id,
                    TipoPersona = p.TipoPersona,
                    Nombre = p.Nombre,
                    Documento = p.Documento,
                    Email = p.Email,
                    Celular = p.Celular,
                    Telefono = p.Telefono,
                    Direccion = p.Direccion,
                    Ciudad = p.Ciudad,
                    Nombres = p.Nombres,
                    Apellidos = p.Apellidos,
                    RazonSocial = p.RazonSocial,
                    RepresentanteLegal = p.RepresentanteLegal,
                    NIT = p.NIT,
                    Activo = p.Activo,
                    FechaRegistro = p.FechaRegistro,
                    FechaActualizacion = p.FechaActualizacion,
                    TipoDocumentoIdTipoDocumento = p.TipoDocumentoIdTipoDocumento,
                    TipoDocumentoNombre = p.TipoDocumento != null ? p.TipoDocumento.Nombre : null
                })
                .ToListAsync();

            return Ok(proveedores);
        }

        // GET: api/proveedores/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProveedorResponseDto>> GetProveedor(int id)
        {
            var proveedor = await _context.Proveedores
                .Include(p => p.TipoDocumento)
                .Where(p => p.Id == id)
                .Select(p => new ProveedorResponseDto
                {
                    Id = p.Id,
                    TipoPersona = p.TipoPersona,
                    Nombre = p.Nombre,
                    Documento = p.Documento,
                    Email = p.Email,
                    Celular = p.Celular,
                    Telefono = p.Telefono,
                    Direccion = p.Direccion,
                    Ciudad = p.Ciudad,
                    Nombres = p.Nombres,
                    Apellidos = p.Apellidos,
                    RazonSocial = p.RazonSocial,
                    RepresentanteLegal = p.RepresentanteLegal,
                    NIT = p.NIT,
                    Activo = p.Activo,
                    FechaRegistro = p.FechaRegistro,
                    FechaActualizacion = p.FechaActualizacion,
                    TipoDocumentoIdTipoDocumento = p.TipoDocumentoIdTipoDocumento,
                    TipoDocumentoNombre = p.TipoDocumento != null ? p.TipoDocumento.Nombre : null
                })
                .FirstOrDefaultAsync();

            if (proveedor == null)
            {
                return NotFound();
            }

            return Ok(proveedor);
        }

        // POST: api/proveedores
        [HttpPost]
        public async Task<ActionResult<ProveedorResponseDto>> PostProveedor(ProveedorCreateDto proveedorDto)
        {
            try
            {
                // Validaciones específicas por tipo de persona
                if (proveedorDto.TipoPersona == "natural")
                {
                    if (string.IsNullOrWhiteSpace(proveedorDto.Nombres) || string.IsNullOrWhiteSpace(proveedorDto.Apellidos))
                    {
                        return BadRequest(new { message = "Para persona natural, nombres y apellidos son requeridos" });
                    }
                }
                else if (proveedorDto.TipoPersona == "juridica")
                {
                    if (string.IsNullOrWhiteSpace(proveedorDto.RazonSocial) || string.IsNullOrWhiteSpace(proveedorDto.NIT))
                    {
                        return BadRequest(new { message = "Para persona jurídica, razón social y NIT son requeridos" });
                    }
                }

                // Verificar si ya existe un proveedor con el mismo documento
                var existeProveedor = await _context.Proveedores
                    .AnyAsync(p => p.Documento == proveedorDto.Documento && p.Activo);

                if (existeProveedor)
                {
                    return BadRequest(new { message = "Ya existe un proveedor con este documento" });
                }

                // Verificar si ya existe un proveedor con el mismo email
                var existeEmail = await _context.Proveedores
                    .AnyAsync(p => p.Email == proveedorDto.Email && p.Activo);

                if (existeEmail)
                {
                    return BadRequest(new { message = "Ya existe un proveedor con este email" });
                }

                var proveedor = new Proveedor
                {
                    TipoPersona = proveedorDto.TipoPersona.ToLower(),
                    Nombre = proveedorDto.Nombre.Trim(),
                    Documento = proveedorDto.Documento.Trim(),
                    Email = proveedorDto.Email.Trim().ToLower(),
                    Celular = proveedorDto.Celular?.Trim(),
                    Telefono = proveedorDto.Telefono?.Trim(),
                    Direccion = proveedorDto.Direccion?.Trim(),
                    Ciudad = proveedorDto.Ciudad?.Trim(),
                    Nombres = proveedorDto.Nombres?.Trim(),
                    Apellidos = proveedorDto.Apellidos?.Trim(),
                    RazonSocial = proveedorDto.RazonSocial?.Trim(),
                    RepresentanteLegal = proveedorDto.RepresentanteLegal?.Trim(),
                    NIT = proveedorDto.NIT?.Trim(),
                    TipoDocumentoIdTipoDocumento = proveedorDto.TipoDocumentoIdTipoDocumento,
                    FechaRegistro = DateTime.UtcNow,
                    Activo = true
                };

                _context.Proveedores.Add(proveedor);
                await _context.SaveChangesAsync();

                // Cargar el proveedor con sus relaciones para la respuesta
                var proveedorCreado = await _context.Proveedores
                    .Include(p => p.TipoDocumento)
                    .Where(p => p.Id == proveedor.Id)
                    .Select(p => new ProveedorResponseDto
                    {
                        Id = p.Id,
                        TipoPersona = p.TipoPersona,
                        Nombre = p.Nombre,
                        Documento = p.Documento,
                        Email = p.Email,
                        Celular = p.Celular,
                        Telefono = p.Telefono,
                        Direccion = p.Direccion,
                        Ciudad = p.Ciudad,
                        Nombres = p.Nombres,
                        Apellidos = p.Apellidos,
                        RazonSocial = p.RazonSocial,
                        RepresentanteLegal = p.RepresentanteLegal,
                        NIT = p.NIT,
                        Activo = p.Activo,
                        FechaRegistro = p.FechaRegistro,
                        FechaActualizacion = p.FechaActualizacion,
                        TipoDocumentoIdTipoDocumento = p.TipoDocumentoIdTipoDocumento,
                        TipoDocumentoNombre = p.TipoDocumento != null ? p.TipoDocumento.Nombre : null
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetProveedor), new { id = proveedor.Id }, proveedorCreado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PUT: api/proveedores/5
        [HttpPut("{id}")]
        public async Task<ActionResult<ProveedorResponseDto>> PutProveedor(int id, ProveedorUpdateDto proveedorDto)
        {
            try
            {
                var proveedor = await _context.Proveedores.FindAsync(id);
                if (proveedor == null)
                {
                    return NotFound(new { message = "Proveedor no encontrado" });
                }

                // Validaciones específicas por tipo de persona
                if (proveedorDto.TipoPersona == "natural")
                {
                    if (string.IsNullOrWhiteSpace(proveedorDto.Nombres) || string.IsNullOrWhiteSpace(proveedorDto.Apellidos))
                    {
                        return BadRequest(new { message = "Para persona natural, nombres y apellidos son requeridos" });
                    }
                }
                else if (proveedorDto.TipoPersona == "juridica")
                {
                    if (string.IsNullOrWhiteSpace(proveedorDto.RazonSocial) || string.IsNullOrWhiteSpace(proveedorDto.NIT))
                    {
                        return BadRequest(new { message = "Para persona jurídica, razón social y NIT son requeridos" });
                    }
                }

                // Verificar si ya existe otro proveedor con el mismo documento
                var existeProveedor = await _context.Proveedores
                    .AnyAsync(p => p.Documento == proveedorDto.Documento && p.Id != id && p.Activo);

                if (existeProveedor)
                {
                    return BadRequest(new { message = "Ya existe otro proveedor con este documento" });
                }

                // Verificar si ya existe otro proveedor con el mismo email
                var existeEmail = await _context.Proveedores
                    .AnyAsync(p => p.Email == proveedorDto.Email && p.Id != id && p.Activo);

                if (existeEmail)
                {
                    return BadRequest(new { message = "Ya existe otro proveedor con este email" });
                }

                // Actualizar campos
                proveedor.TipoPersona = proveedorDto.TipoPersona.ToLower();
                proveedor.Nombre = proveedorDto.Nombre.Trim();
                proveedor.Documento = proveedorDto.Documento.Trim();
                proveedor.Email = proveedorDto.Email.Trim().ToLower();
                proveedor.Celular = proveedorDto.Celular?.Trim();
                proveedor.Telefono = proveedorDto.Telefono?.Trim();
                proveedor.Direccion = proveedorDto.Direccion?.Trim();
                proveedor.Ciudad = proveedorDto.Ciudad?.Trim();
                proveedor.Nombres = proveedorDto.Nombres?.Trim();
                proveedor.Apellidos = proveedorDto.Apellidos?.Trim();
                proveedor.RazonSocial = proveedorDto.RazonSocial?.Trim();
                proveedor.RepresentanteLegal = proveedorDto.RepresentanteLegal?.Trim();
                proveedor.NIT = proveedorDto.NIT?.Trim();
                proveedor.TipoDocumentoIdTipoDocumento = proveedorDto.TipoDocumentoIdTipoDocumento;
                proveedor.FechaActualizacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Cargar el proveedor actualizado con sus relaciones
                var proveedorActualizado = await _context.Proveedores
                    .Include(p => p.TipoDocumento)
                    .Where(p => p.Id == id)
                    .Select(p => new ProveedorResponseDto
                    {
                        Id = p.Id,
                        TipoPersona = p.TipoPersona,
                        Nombre = p.Nombre,
                        Documento = p.Documento,
                        Email = p.Email,
                        Celular = p.Celular,
                        Telefono = p.Telefono,
                        Direccion = p.Direccion,
                        Ciudad = p.Ciudad,
                        Nombres = p.Nombres,
                        Apellidos = p.Apellidos,
                        RazonSocial = p.RazonSocial,
                        RepresentanteLegal = p.RepresentanteLegal,
                        NIT = p.NIT,
                        Activo = p.Activo,
                        FechaRegistro = p.FechaRegistro,
                        FechaActualizacion = p.FechaActualizacion,
                        TipoDocumentoIdTipoDocumento = p.TipoDocumentoIdTipoDocumento,
                        TipoDocumentoNombre = p.TipoDocumento != null ? p.TipoDocumento.Nombre : null
                    })
                    .FirstOrDefaultAsync();

                return Ok(proveedorActualizado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PATCH: api/proveedores/5/estado
        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoProveedor(int id, [FromBody] CambiarEstadoRequest request)
        {
            try
            {
                var proveedor = await _context.Proveedores.FindAsync(id);
                if (proveedor == null)
                {
                    return NotFound(new { message = "Proveedor no encontrado" });
                }

                proveedor.Activo = request.Activo; // Mapeo: Activo (Frontend) -> Activo (DB)
                proveedor.FechaActualizacion = DateTime.UtcNow;
                
                // Solo marcar como modificados los campos que cambiaron
                _context.Entry(proveedor).Property(p => p.Activo).IsModified = true;
                _context.Entry(proveedor).Property(p => p.FechaActualizacion).IsModified = true;
                
                await _context.SaveChangesAsync();

                return Ok(new { message = "Estado del proveedor actualizado correctamente", proveedor });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // DELETE: api/proveedores/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProveedor(int id)
        {
            try
            {
                var proveedor = await _context.Proveedores.FindAsync(id);
                if (proveedor == null)
                {
                    return NotFound(new { message = "Proveedor no encontrado" });
                }

                // Soft delete - marcar como inactivo
                proveedor.Activo = false;
                proveedor.FechaActualizacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Proveedor eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/proveedores/buscar?termino=texto
        [HttpGet("buscar")]
        public async Task<ActionResult<IEnumerable<object>>> BuscarProveedores(string termino)
        {
            if (string.IsNullOrWhiteSpace(termino))
            {
                return BadRequest(new { message = "El término de búsqueda es requerido" });
            }

            var proveedores = await _context.Proveedores
                .Where(p => p.Activo && 
                           (p.Nombre!.Contains(termino) || 
                            p.Telefono!.Contains(termino)))
                .OrderBy(p => p.Nombre)
                .Select(p => new
                {
                    Id = p.Id,
                    p.Nombre,
                    p.Telefono,
                    p.Direccion,
                    p.Ciudad,
                    p.Activo
                })
                .ToListAsync();

            return Ok(proveedores);
        }

        private bool ProveedorExists(int id)
        {
            return _context.Proveedores.Any(e => e.Id == id);
        }


    }

    // DTO para cambiar estado
    public class CambiarEstadoRequest
    {
        public bool Activo { get; set; }
    }
}