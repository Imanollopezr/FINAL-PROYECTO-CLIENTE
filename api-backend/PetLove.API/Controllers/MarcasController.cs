using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.DTOs;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarcasController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public MarcasController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/Marcas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MarcaDto>>> GetMarcas([FromQuery] bool includeInactive = false)
        {
            try
            {
                var marcas = await _context.Marcas
                    .Where(m => includeInactive || m.Activo)
                    .OrderBy(m => m.Nombre)
                    .Select(m => new MarcaDto
                    {
                        IdMarca = m.IdMarca,
                        Nombre = m.Nombre,
                        Descripcion = m.Descripcion,
                        Activo = m.Activo,
                        FechaRegistro = m.FechaRegistro
                    })
                    .ToListAsync();

                return Ok(marcas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // GET: api/Marcas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MarcaDto>> GetMarca(int id, [FromQuery] bool includeInactive = false)
        {
            try
            {
                var marca = await _context.Marcas
                    .Where(m => m.IdMarca == id && (includeInactive || m.Activo))
                    .Select(m => new MarcaDto
                    {
                        IdMarca = m.IdMarca,
                        Nombre = m.Nombre,
                        Descripcion = m.Descripcion,
                        Activo = m.Activo,
                        FechaRegistro = m.FechaRegistro
                    })
                    .FirstOrDefaultAsync();

                if (marca == null)
                {
                    return NotFound();
                }

                return Ok(marca);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // PUT: api/Marcas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMarca(int id, MarcaUpdateDto marcaDto)
        {

            try
            {
                // Validaciones de campos requeridos
                if (string.IsNullOrWhiteSpace(marcaDto.Nombre) || marcaDto.Nombre.Length < 2)
                {
                    return BadRequest(new { message = "El nombre de la marca es requerido y debe tener al menos 2 caracteres" });
                }

                var marcaExistente = await _context.Marcas.FindAsync(id);
                if (marcaExistente == null)
                {
                    return NotFound(new { message = "Marca no encontrada" });
                }

                // Validar que el nombre no exista en otra marca
                var nombreExistente = await _context.Marcas
                    .AnyAsync(m => m.Nombre.ToLower() == marcaDto.Nombre.ToLower() && m.IdMarca != id);

                if (nombreExistente)
                {
                    return BadRequest(new { message = "Ya existe otra marca con este nombre" });
                }

                // Actualizar propiedades con normalización
                marcaExistente.Nombre = marcaDto.Nombre.Trim();
                marcaExistente.Descripcion = marcaDto.Descripcion?.Trim();
                marcaExistente.Activo = marcaDto.Activo;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Marca actualizada correctamente" });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MarcaExists(id))
                {
                    return NotFound(new { message = "Marca no encontrada" });
                }
                else
                {
                    return StatusCode(500, new { message = "Error de concurrencia al actualizar la marca" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PATCH: api/marcas/{id}/estado
        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoMarca(int id, [FromBody] CambiarEstadoRequest request)
        {
            try
            {
                var marca = await _context.Marcas.FindAsync(id);
                if (marca == null)
                {
                    return NotFound(new { message = "Marca no encontrada" });
                }

                // Actualizar solo el estado Activo
                marca.Activo = request.Activo;
                _context.Entry(marca).Property(m => m.Activo).IsModified = true;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Estado de la marca actualizado correctamente", marca });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // POST: api/Marcas
        [HttpPost]
        public async Task<ActionResult<Marca>> PostMarca(Marca marca)
        {
            try
            {
                // Validaciones de campos requeridos
                if (string.IsNullOrWhiteSpace(marca.Nombre) || marca.Nombre.Length < 2)
                {
                    return BadRequest(new { message = "El nombre de la marca es requerido y debe tener al menos 2 caracteres" });
                }

                // Validar que el nombre no exista
                var nombreExistente = await _context.Marcas
                    .AnyAsync(m => m.Nombre.ToLower() == marca.Nombre.ToLower());

                if (nombreExistente)
                {
                    return BadRequest(new { message = "Ya existe una marca con este nombre" });
                }

                // Normalizar datos
                marca.Nombre = marca.Nombre.Trim();
                marca.Descripcion = marca.Descripcion?.Trim();
                marca.FechaRegistro = DateTime.Now;
                marca.Activo = true;

                _context.Marcas.Add(marca);
                await _context.SaveChangesAsync();

                return CreatedAtAction("GetMarca", new { id = marca.IdMarca }, marca);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // DELETE: api/Marcas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMarca(int id)
        {
            try
            {
                var marca = await _context.Marcas.FindAsync(id);
                if (marca == null || !marca.Activo)
                {
                    return NotFound(new { message = "Marca no encontrada" });
                }

                // Verificar si hay productos usando esta marca
                var productosConMarca = await _context.Productos
                    .CountAsync(p => p.IdMarcaProducto == id && p.Activo);

                if (productosConMarca > 0)
                {
                    return BadRequest(new { message = $"No se puede eliminar la marca porque tiene {productosConMarca} productos asociados" });
                }

                // Soft delete - marcar como inactivo en lugar de eliminar permanentemente
                marca.Activo = false;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Marca eliminada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/Marcas/buscar/{termino}
        [HttpGet("buscar/{termino}")]
        public async Task<ActionResult<IEnumerable<Marca>>> BuscarMarcas(string termino)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(termino))
                {
                    return BadRequest(new { message = "El término de búsqueda es requerido" });
                }

                var marcas = await _context.Marcas
                    .Where(m => m.Activo && 
                               (m.Nombre.ToLower().Contains(termino.ToLower()) ||
                                (m.Descripcion != null && m.Descripcion.ToLower().Contains(termino.ToLower()))))
                    .OrderBy(m => m.Nombre)
                    .ToListAsync();

                return Ok(marcas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        private bool MarcaExists(int id)
        {
            return _context.Marcas.Any(e => e.IdMarca == id);
        }
    }
}