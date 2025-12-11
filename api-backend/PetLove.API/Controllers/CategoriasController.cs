using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public CategoriasController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/categorias
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Categoria>>> GetCategorias()
        {
            try
            {
                var categorias = await _context.Categorias
                    .OrderBy(c => c.Nombre)
                    .ToListAsync();

                return Ok(categorias);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // GET: api/categorias/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Categoria>> GetCategoria(int id)
        {
            try
            {
                var categoria = await _context.Categorias.FindAsync(id);

                if (categoria == null || !categoria.Activo)
                {
                    return NotFound();
                }

                return Ok(categoria);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // POST: api/categorias
        [HttpPost]
        public async Task<ActionResult<Categoria>> PostCategoria([FromBody] Categoria categoria)
        {
            try
            {
                // Validaciones de campos requeridos
                if (string.IsNullOrWhiteSpace(categoria.Nombre) || categoria.Nombre.Length < 2)
                {
                    return BadRequest("El nombre de la categoría es requerido y debe tener al menos 2 caracteres");
                }

                // Normalizar datos
                categoria.Nombre = categoria.Nombre.Trim();
                categoria.Descripcion = categoria.Descripcion?.Trim();

                // Verificar si la categoría ya existe (case-insensitive)
                var categoriaExiste = await _context.Categorias
                    .AnyAsync(c => c.Nombre.ToLower() == categoria.Nombre.ToLower());

                if (categoriaExiste)
                {
                    return Conflict("La categoría ya existe");
                }

                categoria.FechaRegistro = DateTime.Now;
                categoria.Activo = true;

                _context.Categorias.Add(categoria);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCategoria), new { id = categoria.IdCategoriaProducto }, categoria);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // PUT: api/categorias/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategoria(int id, [FromBody] Categoria categoria)
        {
            try
            {
                if (categoria == null)
                {
                    return BadRequest("Cuerpo de la solicitud inválido");
                }

                var categoriaExistente = await _context.Categorias.FindAsync(id);
                if (categoriaExistente == null)
                {
                    return NotFound();
                }

                // Validaciones de campos cuando se actualiza nombre/descripcion
                if (!string.IsNullOrWhiteSpace(categoria.Nombre))
                {
                    if (categoria.Nombre.Length < 2)
                    {
                        return BadRequest("El nombre de la categoría es requerido y debe tener al menos 2 caracteres");
                    }

                    var nombreNormalizado = categoria.Nombre.Trim();
                    var nombreExiste = await _context.Categorias
                        .AnyAsync(c => c.Nombre.ToLower() == nombreNormalizado.ToLower() && c.IdCategoriaProducto != id);

                    if (nombreExiste)
                    {
                        return Conflict("Ya existe otra categoría con ese nombre");
                    }

                    categoriaExistente.Nombre = nombreNormalizado;
                }

                // Actualizar descripción si viene
                if (categoria.Descripcion != null)
                {
                    categoriaExistente.Descripcion = categoria.Descripcion.Trim();
                }

                // Permitir actualizar estado (activo/inactivo) sin requerir nombre
                // Si el cliente envía el campo Activo, aplicarlo
                categoriaExistente.Activo = categoria.Activo;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // PATCH: api/categorias/{id}/estado
        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> PatchEstadoCategoria(int id, [FromBody] System.Text.Json.JsonElement payload)
        {
            try
            {
                var categoria = await _context.Categorias.FindAsync(id);
                if (categoria == null)
                {
                    return NotFound();
                }

                // Leer "activo" del payload de forma segura
                if (!payload.TryGetProperty("activo", out var activoElement) ||
                    (activoElement.ValueKind != System.Text.Json.JsonValueKind.True && activoElement.ValueKind != System.Text.Json.JsonValueKind.False))
                {
                    return BadRequest("El campo 'activo' es requerido y debe ser booleano");
                }

                bool nuevoEstado = activoElement.GetBoolean();
                categoria.Activo = nuevoEstado;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Estado de la categoría actualizado" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        // DELETE: api/categorias/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategoria(int id)
        {
            try
            {
                var categoria = await _context.Categorias.FindAsync(id);
                if (categoria == null || !categoria.Activo)
                {
                    return NotFound();
                }

                // Verificar si hay productos usando esta categoría
                var productosConCategoria = await _context.Productos
                    .CountAsync(p => p.IdCategoriaProducto == id && p.Activo);

                if (productosConCategoria > 0)
                {
                    return BadRequest($"No se puede eliminar la categoría porque tiene {productosConCategoria} productos asociados");
                }

                // Eliminación permanente de la base de datos
                _context.Categorias.Remove(categoria);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        private bool CategoriaExists(int id)
        {
            return _context.Categorias.Any(e => e.IdCategoriaProducto == id && e.Activo);
        }
    }
}