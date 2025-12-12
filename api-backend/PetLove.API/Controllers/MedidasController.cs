using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.DTOs;
using PetLove.API.Attributes;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedidasController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public MedidasController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/medidas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MedidaDto>>> GetMedidas([FromQuery] bool includeInactive = false)
        {
            var medidas = await _context.Medidas
                .Where(m => includeInactive || m.Activo)
                .Select(m => new MedidaDto
                {
                    IdMedida = m.IdMedida,
                    Nombre = m.Nombre,
                    Descripcion = m.Descripcion,
                    Abreviatura = m.Abreviatura,
                    Activo = m.Activo,
                    FechaRegistro = m.FechaRegistro
                })
                .ToListAsync();

            return Ok(medidas);
        }

        // GET: api/medidas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MedidaDto>> GetMedida(int id, [FromQuery] bool includeInactive = false)
        {
            var medida = await _context.Medidas
                .Where(m => m.IdMedida == id && (includeInactive || m.Activo))
                .Select(m => new MedidaDto
                {
                    IdMedida = m.IdMedida,
                    Nombre = m.Nombre,
                    Descripcion = m.Descripcion,
                    Abreviatura = m.Abreviatura,
                    Activo = m.Activo,
                    FechaRegistro = m.FechaRegistro
                })
                .FirstOrDefaultAsync();

            if (medida == null)
            {
                return NotFound(new { message = "Medida no encontrada" });
            }

            return Ok(medida);
        }

        // PUT: api/medidas/5
        [HttpPut("{id}")]
        [RequireRole("Administrador", "Asistente")]
        public async Task<IActionResult> PutMedida(int id, MedidaUpdateDto medidaDto)
        {
            try
            {
                var existingMedida = await _context.Medidas.FindAsync(id);
                if (existingMedida == null)
                {
                    return NotFound(new { message = "Medida no encontrada" });
                }

                // Permitir actualizar medidas inactivas para poder cambiar el estado

                if (!string.IsNullOrEmpty(medidaDto.Nombre))
                    existingMedida.Nombre = medidaDto.Nombre.Trim();

                if (!string.IsNullOrEmpty(medidaDto.Descripcion))
                    existingMedida.Descripcion = medidaDto.Descripcion.Trim();

                if (!string.IsNullOrEmpty(medidaDto.Abreviatura))
                    existingMedida.Abreviatura = medidaDto.Abreviatura.Trim();

                // MedidaUpdateDto.Activo es no-nullable; asignamos directamente
                existingMedida.Activo = medidaDto.Activo;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Medida actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // POST: api/Medidas
        [HttpPost]
        public async Task<ActionResult<MedidaDto>> PostMedida(MedidaCreateDto medidaDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(medidaDto.Nombre) || medidaDto.Nombre.Trim().Length < 2)
                {
                    return BadRequest(new { message = "El nombre de la medida es requerido y debe tener al menos 2 caracteres" });
                }
                var nombreNormalizado = medidaDto.Nombre.Trim().ToLower();
                var existeNombre = await _context.Medidas.AnyAsync(m =>
                    m.Nombre.ToLower() == nombreNormalizado);
                if (existeNombre)
                {
                    return BadRequest(new { message = "Ya existe una medida con este nombre" });
                }
                var medida = new Medida
                {
                    Nombre = medidaDto.Nombre,
                    Abreviatura = medidaDto.Abreviatura,
                    Descripcion = medidaDto.Descripcion,
                    FechaRegistro = DateTime.Now,
                    Activo = true
                };

                _context.Medidas.Add(medida);
                await _context.SaveChangesAsync();

                var medidaResponse = new MedidaDto
                {
                    IdMedida = medida.IdMedida,
                    Nombre = medida.Nombre,
                    Abreviatura = medida.Abreviatura,
                    Descripcion = medida.Descripcion,
                    Activo = medida.Activo,
                    FechaRegistro = medida.FechaRegistro
                };

                return CreatedAtAction("GetMedida", new { id = medida.IdMedida }, medidaResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // DELETE: api/medidas/5
        [HttpDelete("{id}")]
        [RequireRole("Administrador")]
        public async Task<IActionResult> DeleteMedida(int id)
        {
            try
            {
                var medida = await _context.Medidas.FindAsync(id);
                if (medida == null)
                {
                    return NotFound(new { message = "Medida no encontrada" });
                }

                // En lugar de eliminar, marcamos como inactiva
                medida.Activo = false;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Medida desactivada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }
        // PATCH: api/medidas/{id}/estado
        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoMedida(int id, [FromBody] CambiarEstadoRequest request)
        {
            try
            {
                var medida = await _context.Medidas.FindAsync(id);
                if (medida == null)
                {
                    return NotFound(new { message = "Medida no encontrada" });
                }

                // Actualizar solo el estado Activo
                medida.Activo = request.Activo;
                _context.Entry(medida).Property(m => m.Activo).IsModified = true;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Estado de la medida actualizado correctamente", medida });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }
    }
}
