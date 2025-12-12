using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using System.Text.RegularExpressions;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ColoresController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public ColoresController(PetLoveDbContext context)
        {
            _context = context;
        }

        // Helpers
        private static bool EsCodigoColorValido(string? color)
        {
            if (string.IsNullOrWhiteSpace(color)) return false;
            var c = color.Trim();

            // #RGB or #RRGGBB
            if (Regex.IsMatch(c, "^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$")) return true;

            // rgb() or rgba()
            if (Regex.IsMatch(c, @"^rgb(a)?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(,\s*(0(\.\d+)?|1(\.0+)?))?\s*\)$")) return true;

            // hsl() or hsla()
            if (Regex.IsMatch(c, @"^hsl(a)?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(,\s*(0(\.\d+)?|1(\.0+)?))?\s*\)$")) return true;

            // Allow a basic set of CSS named colors
            var named = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "black","white","red","green","blue","yellow","orange","purple","pink","brown","gray","grey","cyan","magenta","teal","navy","silver","gold"
            };
            if (named.Contains(c)) return true;

            return false;
        }

        private static bool EsNombreValido(string? nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return false;
            var n = nombre.Trim();
            return n.Length >= 2 && n.Length <= 50;
        }

        // GET: api/colores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Color>>> GetColores([FromQuery] bool includeInactive = false)
        {
            var colores = await _context.Colores
                .AsNoTracking()
                .Where(c => includeInactive || c.Activo)
                .OrderBy(c => c.Nombre)
                .ToListAsync();
            return Ok(colores);
        }

        // GET: api/colores/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Color>> GetColor(int id)
        {
            var color = await _context.Colores.FindAsync(id);
            if (color == null)
            {
                return NotFound(new { message = "Color no encontrado" });
            }
            return Ok(color);
        }

        // POST: api/colores
        [HttpPost]
        public async Task<ActionResult<Color>> PostColor([FromBody] Color color)
        {
            if (!EsNombreValido(color.Nombre))
            {
                return BadRequest(new { message = "Nombre inválido (2-50 caracteres)" });
            }
            if (!string.IsNullOrWhiteSpace(color.Codigo) && !EsCodigoColorValido(color.Codigo))
            {
                return BadRequest(new { message = "Descripción debe ser un color CSS válido" });
            }

            color.Activo = color.Activo;

            var existeNombre = await _context.Colores
                .AnyAsync(c => c.Nombre.ToLower() == color.Nombre.Trim().ToLower());
            if (existeNombre)
            {
                return Conflict(new { message = "Ya existe un registro con ese nombre" });
            }

            _context.Colores.Add(color);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetColor), new { id = color.IdColor }, color);
        }

        // PUT: api/colores/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutColor(int id, [FromBody] Color color)
        {
            if (id == 1)
            {
                return Conflict(new { message = "El color 'No aplica' (ID=1) no puede modificarse" });
            }
            var existente = await _context.Colores.FindAsync(id);
            if (existente == null)
            {
                return NotFound(new { message = "Color no encontrado" });
            }

            if (!string.IsNullOrWhiteSpace(color.Nombre))
            {
                if (!EsNombreValido(color.Nombre))
                {
                    return BadRequest(new { message = "Nombre inválido (2-50 caracteres)" });
                }
                var nombreEnUso = await _context.Colores
                    .AnyAsync(c => c.IdColor != id && c.Nombre.ToLower() == color.Nombre.Trim().ToLower());
                if (nombreEnUso)
                {
                    return Conflict(new { message = "Ya existe un registro con ese nombre" });
                }
                existente.Nombre = color.Nombre.Trim();
            }

            if (!string.IsNullOrWhiteSpace(color.Codigo))
            {
                if (!EsCodigoColorValido(color.Codigo))
                {
                    return BadRequest(new { message = "Descripción debe ser un color CSS válido" });
                }
                existente.Codigo = color.Codigo.Trim();
            }

            // Permitir cambiar Activo si viene en el body
            existente.Activo = color.Activo;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PATCH: api/colores/{id}/estado
        [HttpPatch("{id:int}/estado")]
        public async Task<IActionResult> PatchEstadoColor(int id, [FromBody] bool activo)
        {
            if (id == 1)
            {
                return Conflict(new { message = "El color 'No aplica' (ID=1) no puede desactivarse" });
            }
            var existente = await _context.Colores.FindAsync(id);
            if (existente == null)
            {
                return NotFound(new { message = "Color no encontrado" });
            }

            existente.Activo = activo;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/colores/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteColor(int id)
        {
            if (id == 1)
            {
                return Conflict(new { message = "El color 'No aplica' (ID=1) no puede eliminarse" });
            }
            var existente = await _context.Colores.FindAsync(id);
            if (existente == null)
            {
                return NotFound(new { message = "Color no encontrado" });
            }

            // Validar que no tenga productos activos asociados
            var tieneProductosActivos = await _context.Productos
                .AnyAsync(p => p.IdColor == id && p.Activo);
            if (tieneProductosActivos)
            {
                return Conflict(new { message = "No se puede eliminar: tiene productos activos asociados" });
            }

            _context.Colores.Remove(existente);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
