using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MetodosPagoController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public MetodosPagoController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/MetodosPago
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MetodoPago>>> GetMetodosPago()
        {
            try
            {
                var metodosPago = await _context.MetodosPago
                    .Where(m => m.Activo)
                    .OrderBy(m => m.Nombre)
                    .ToListAsync();

                return Ok(metodosPago);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // GET: api/MetodosPago/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MetodoPago>> GetMetodoPago(int id)
        {
            try
            {
                var metodoPago = await _context.MetodosPago.FindAsync(id);

                if (metodoPago == null || !metodoPago.Activo)
                {
                    return NotFound();
                }

                return Ok(metodoPago);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // PUT: api/MetodosPago/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMetodoPago(int id, MetodoPago metodoPago)
        {
            if (id != metodoPago.IdMetodoPago)
            {
                return BadRequest("El ID no coincide con el método de pago.");
            }

            try
            {
                _context.Entry(metodoPago).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MetodoPagoExists(id))
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

        // POST: api/MetodosPago
        [HttpPost]
        public async Task<ActionResult<MetodoPago>> PostMetodoPago(MetodoPago metodoPago)
        {
            try
            {
                metodoPago.FechaRegistro = DateTime.Now;
                metodoPago.Activo = true;

                _context.MetodosPago.Add(metodoPago);
                await _context.SaveChangesAsync();

                return CreatedAtAction("GetMetodoPago", new { id = metodoPago.IdMetodoPago }, metodoPago);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // DELETE: api/MetodosPago/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMetodoPago(int id)
        {
            try
            {
                var metodoPago = await _context.MetodosPago.FindAsync(id);
                if (metodoPago == null)
                {
                    return NotFound();
                }

                // Soft delete - marcar como inactivo
                metodoPago.Activo = false;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        private bool MetodoPagoExists(int id)
        {
            return _context.MetodosPago.Any(e => e.IdMetodoPago == id);
        }
    }
}