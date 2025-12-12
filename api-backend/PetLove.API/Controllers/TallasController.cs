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
    public class TallasController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public TallasController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/tallas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TallaDto>>> GetTallas([FromQuery] bool includeInactive = false)
        {
            var tallas = await _context.Tallas
                .Where(t => includeInactive || t.Activo)
                .Select(t => new TallaDto
                {
                    IdTalla = t.IdTalla,
                    Nombre = t.Nombre,
                    Descripcion = t.Descripcion,
                    Abreviatura = t.Abreviatura,
                    Activo = t.Activo,
                    FechaRegistro = t.FechaRegistro
                })
                .ToListAsync();

            return Ok(tallas);
        }

        // GET: api/tallas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TallaDto>> GetTalla(int id, [FromQuery] bool includeInactive = false)
        {
            var talla = await _context.Tallas
                .Where(t => t.IdTalla == id && (includeInactive || t.Activo))
                .Select(t => new TallaDto
                {
                    IdTalla = t.IdTalla,
                    Nombre = t.Nombre,
                    Descripcion = t.Descripcion,
                    Abreviatura = t.Abreviatura,
                    Activo = t.Activo,
                    FechaRegistro = t.FechaRegistro
                })
                .FirstOrDefaultAsync();

            if (talla == null)
            {
                return NotFound(new { message = "Talla no encontrada" });
            }

            return Ok(talla);
        }

        // PUT: api/tallas/5
        [HttpPut("{id}")]
        [RequireRole("Administrador", "Asistente")]
        public async Task<IActionResult> PutTalla(int id, TallaUpdateDto tallaDto)
        {
            try
            {
                if (id == 1)
                {
                    return Conflict(new { message = "La talla 'No aplica' (ID=1) no puede modificarse" });
                }
                var existingTalla = await _context.Tallas.FindAsync(id);
                if (existingTalla == null)
                {
                    return NotFound(new { message = "Talla no encontrada" });
                }

                if (!string.IsNullOrEmpty(tallaDto.Nombre))
                    existingTalla.Nombre = tallaDto.Nombre.Trim();

                if (!string.IsNullOrEmpty(tallaDto.Descripcion))
                    existingTalla.Descripcion = tallaDto.Descripcion.Trim();

                if (!string.IsNullOrEmpty(tallaDto.Abreviatura))
                    existingTalla.Abreviatura = tallaDto.Abreviatura.Trim();

                existingTalla.Activo = tallaDto.Activo;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Talla actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // POST: api/tallas
        [HttpPost]
        public async Task<ActionResult<TallaDto>> PostTalla(TallaCreateDto tallaDto)
        {
            try
            {
                var talla = new Talla
                {
                    Nombre = tallaDto.Nombre,
                    Abreviatura = tallaDto.Abreviatura,
                    Descripcion = tallaDto.Descripcion,
                    FechaRegistro = DateTime.Now,
                    Activo = true
                };

                _context.Tallas.Add(talla);
                await _context.SaveChangesAsync();

                var tallaResponse = new TallaDto
                {
                    IdTalla = talla.IdTalla,
                    Nombre = talla.Nombre,
                    Abreviatura = talla.Abreviatura,
                    Descripcion = talla.Descripcion,
                    Activo = talla.Activo,
                    FechaRegistro = talla.FechaRegistro
                };

                return CreatedAtAction("GetTalla", new { id = talla.IdTalla }, tallaResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // DELETE: api/tallas/5
        [HttpDelete("{id}")]
        [RequireRole("Administrador")]
        public async Task<IActionResult> DeleteTalla(int id)
        {
            try
            {
                if (id == 1)
                {
                    return Conflict(new { message = "La talla 'No aplica' (ID=1) no puede eliminarse" });
                }
                var talla = await _context.Tallas.FindAsync(id);
                if (talla == null)
                {
                    return NotFound(new { message = "Talla no encontrada" });
                }

                talla.Activo = false;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Talla desactivada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PATCH: api/tallas/{id}/estado
        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoTalla(int id, [FromBody] CambiarEstadoRequest request)
        {
            try
            {
                if (id == 1)
                {
                    return Conflict(new { message = "La talla 'No aplica' (ID=1) no puede desactivarse" });
                }
                var talla = await _context.Tallas.FindAsync(id);
                if (talla == null)
                {
                    return NotFound(new { message = "Talla no encontrada" });
                }

                talla.Activo = request.Activo;
                _context.Entry(talla).Property(t => t.Activo).IsModified = true;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Estado de la talla actualizado correctamente", talla });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }
    }
}
