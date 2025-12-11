using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PermisosController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public PermisosController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/permisos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Permiso>>> GetPermisos()
        {
            var permisos = await _context.Permisos
                .OrderBy(p => p.Nombre)
                .ToListAsync();
            return Ok(permisos);
        }

        // GET: api/permisos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Permiso>> GetPermiso(int id)
        {
            var permiso = await _context.Permisos.FindAsync(id);
            if (permiso == null) return NotFound(new { message = "Permiso no encontrado" });
            return Ok(permiso);
        }

        // POST: api/permisos
        [HttpPost]
        public async Task<ActionResult<Permiso>> CreatePermiso(Permiso permiso)
        {
            var existente = await _context.Permisos.FirstOrDefaultAsync(p => p.Nombre.ToLower() == permiso.Nombre.ToLower());
            if (existente != null) return BadRequest(new { message = "Ya existe un permiso con ese nombre" });

            permiso.FechaRegistro = DateTime.Now;
            _context.Permisos.Add(permiso);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetPermiso), new { id = permiso.Id }, permiso);
        }

        // PUT: api/permisos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePermiso(int id, Permiso permiso)
        {
            if (id != permiso.Id) return BadRequest(new { message = "El ID del permiso no coincide" });

            var existente = await _context.Permisos.FindAsync(id);
            if (existente == null) return NotFound(new { message = "Permiso no encontrado" });

            var mismoNombre = await _context.Permisos.FirstOrDefaultAsync(p => p.Nombre.ToLower() == permiso.Nombre.ToLower() && p.Id != id);
            if (mismoNombre != null) return BadRequest(new { message = "Ya existe otro permiso con ese nombre" });

            existente.Nombre = permiso.Nombre;
            existente.Descripcion = permiso.Descripcion;
            existente.Activo = permiso.Activo;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Permiso actualizado correctamente", permiso = existente });
        }

        // DELETE: api/permisos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePermiso(int id)
        {
            var permiso = await _context.Permisos.FindAsync(id);
            if (permiso == null) return NotFound(new { message = "Permiso no encontrado" });

            var tieneAsignaciones = await _context.PermisosRol.AnyAsync(pr => pr.PermisoId == id);
            if (tieneAsignaciones) return BadRequest(new { message = "No se puede eliminar el permiso porque está asignado a roles" });

            _context.Permisos.Remove(permiso);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Permiso eliminado correctamente" });
        }

        // GET: api/permisos/rol/5
        [HttpGet("rol/{rolId}")]
        public async Task<ActionResult<IEnumerable<Permiso>>> GetPermisosPorRol(int rolId)
        {
            var rol = await _context.Roles.FindAsync(rolId);
            if (rol == null) return NotFound(new { message = "Rol no encontrado" });

            var permisos = await _context.PermisosRol
                .Where(pr => pr.RolId == rolId)
                .Select(pr => pr.Permiso)
                .OrderBy(p => p.Nombre)
                .ToListAsync();

            return Ok(permisos);
        }

        // POST: api/permisos/rol/assign
        [HttpPost("rol/assign")]
        public async Task<IActionResult> AsignarPermisoARol([FromBody] AssignPermisoRolRequest request)
        {
            var rol = await _context.Roles.FindAsync(request.RolId);
            var permiso = await _context.Permisos.FindAsync(request.PermisoId);
            if (rol == null || permiso == null) return NotFound(new { message = "Rol o Permiso no encontrado" });

            var existe = await _context.PermisosRol.AnyAsync(pr => pr.RolId == request.RolId && pr.PermisoId == request.PermisoId);
            if (existe) return BadRequest(new { message = "El permiso ya está asignado a este rol" });

            _context.PermisosRol.Add(new PermisoRol { RolId = request.RolId, PermisoId = request.PermisoId });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Permiso asignado correctamente" });
        }

        // POST: api/permisos/rol/remove
        [HttpPost("rol/remove")]
        public async Task<IActionResult> RemoverPermisoDeRol([FromBody] AssignPermisoRolRequest request)
        {
            var asignacion = await _context.PermisosRol.FirstOrDefaultAsync(pr => pr.RolId == request.RolId && pr.PermisoId == request.PermisoId);
            if (asignacion == null) return NotFound(new { message = "Asignación no encontrada" });

            _context.PermisosRol.Remove(asignacion);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Permiso removido correctamente" });
        }

        public class AssignPermisoRolRequest
        {
            public int RolId { get; set; }
            public int PermisoId { get; set; }
        }
    }
}