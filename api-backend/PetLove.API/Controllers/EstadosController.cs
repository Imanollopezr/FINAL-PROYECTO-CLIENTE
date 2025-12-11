using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EstadosController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public EstadosController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/Estados
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Estado>>> GetEstados()
        {
            try
            {
                var estados = await _context.Estados
                    .Where(e => e.Activo)
                    .OrderBy(e => e.Nombre)
                    .ToListAsync();

                return Ok(estados);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // GET: api/Estados/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Estado>> GetEstado(int id)
        {
            try
            {
                var estado = await _context.Estados.FindAsync(id);

                if (estado == null || !estado.Activo)
                {
                    return NotFound();
                }

                return Ok(estado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // PUT: api/Estados/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutEstado(int id, Estado estado)
        {
            if (id != estado.IdEstado)
            {
                return BadRequest("El ID no coincide con el estado.");
            }

            try
            {
                _context.Entry(estado).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EstadoExists(id))
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

        // POST: api/Estados
        [HttpPost]
        public async Task<ActionResult<Estado>> PostEstado(Estado estado)
        {
            try
            {
                estado.FechaRegistro = DateTime.Now;
                estado.Activo = true;

                _context.Estados.Add(estado);
                await _context.SaveChangesAsync();

                return CreatedAtAction("GetEstado", new { id = estado.IdEstado }, estado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // DELETE: api/Estados/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEstado(int id)
        {
            try
            {
                var estado = await _context.Estados.FindAsync(id);
                if (estado == null)
                {
                    return NotFound();
                }

                // Soft delete - marcar como inactivo
                estado.Activo = false;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        private bool EstadoExists(int id)
        {
            return _context.Estados.Any(e => e.IdEstado == id);
        }
    }
}