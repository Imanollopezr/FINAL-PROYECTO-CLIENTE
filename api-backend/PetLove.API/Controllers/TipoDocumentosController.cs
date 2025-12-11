using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TipoDocumentosController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public TipoDocumentosController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/TipoDocumentos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TipoDocumento>>> GetTipoDocumentos()
        {
            try
            {
                var tipoDocumentos = await _context.TipoDocumentos
                    .Where(t => t.Activo)
                    .OrderBy(t => t.Nombre)
                    .ToListAsync();

                return Ok(tipoDocumentos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // GET: api/TipoDocumentos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TipoDocumento>> GetTipoDocumento(int id)
        {
            try
            {
                var tipoDocumento = await _context.TipoDocumentos.FindAsync(id);

                if (tipoDocumento == null || !tipoDocumento.Activo)
                {
                    return NotFound();
                }

                return Ok(tipoDocumento);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // PUT: api/TipoDocumentos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTipoDocumento(int id, TipoDocumento tipoDocumento)
        {
            if (id != tipoDocumento.IdTipoDocumento)
            {
                return BadRequest("El ID no coincide con el tipo de documento.");
            }

            try
            {
                _context.Entry(tipoDocumento).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TipoDocumentoExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // POST: api/TipoDocumentos
        [HttpPost]
        public async Task<ActionResult<TipoDocumento>> PostTipoDocumento(TipoDocumento tipoDocumento)
        {
            try
            {
                tipoDocumento.FechaRegistro = DateTime.Now;
                tipoDocumento.Activo = true;

                _context.TipoDocumentos.Add(tipoDocumento);
                await _context.SaveChangesAsync();

                return CreatedAtAction("GetTipoDocumento", new { id = tipoDocumento.IdTipoDocumento }, tipoDocumento);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // DELETE: api/TipoDocumentos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTipoDocumento(int id)
        {
            try
            {
                var tipoDocumento = await _context.TipoDocumentos.FindAsync(id);
                if (tipoDocumento == null)
                {
                    return NotFound();
                }

                // Soft delete - marcar como inactivo
                tipoDocumento.Activo = false;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        private bool TipoDocumentoExists(int id)
        {
            return _context.TipoDocumentos.Any(e => e.IdTipoDocumento == id);
        }
    }
}