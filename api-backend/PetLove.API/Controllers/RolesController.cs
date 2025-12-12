using Microsoft.AspNetCore.Mvc;
using PetLove.API.Attributes;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.DTOs;

namespace PetLove.API.Controllers
{
    [ApiController]
    [RequirePermiso("GestionRoles")]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly PetLoveDbContext _context;

        public RolesController(PetLoveDbContext context)
        {
            _context = context;
        }

        // GET: api/roles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Rol>>> GetRoles()
        {
            try
            {
                var roles = await _context.Roles
                    .OrderBy(r => r.NombreRol)
                    .ToListAsync();
                return Ok(roles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/roles/with-permisos
        [HttpGet("with-permisos")]
        public async Task<ActionResult<IEnumerable<RolWithPermisosDto>>> GetRolesWithPermisos()
        {
            try
            {
                var roles = await _context.Roles
                    .OrderBy(r => r.NombreRol)
                    .ToListAsync();

                var result = new List<RolWithPermisosDto>();

                foreach (var r in roles)
                {
                    var permisos = await _context.PermisosRol
                        .Where(pr => pr.RolId == r.Id)
                        .Select(pr => pr.Permiso.Nombre)
                        .OrderBy(n => n)
                        .ToListAsync();

                    result.Add(new RolWithPermisosDto
                    {
                        Id = r.Id,
                        NombreRol = r.NombreRol,
                        Descripcion = r.Descripcion,
                        Activo = r.Activo,
                        FechaRegistro = r.FechaRegistro,
                        Permisos = permisos
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/roles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Rol>> GetRol(int id)
        {
            try
            {
                var rol = await _context.Roles.FindAsync(id);

                if (rol == null)
                {
                    return NotFound(new { message = "Rol no encontrado" });
                }

                return Ok(rol);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/roles/buscar/{termino}
        [HttpGet("buscar/{termino}")]
        public async Task<ActionResult<IEnumerable<Rol>>> BuscarRoles(string termino)
        {
            try
            {
                var roles = await _context.Roles
                    .Where(r => r.NombreRol!.Contains(termino) || r.Descripcion!.Contains(termino))
                    .OrderBy(r => r.NombreRol)
                    .ToListAsync();

                return Ok(roles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // POST: api/roles
        [HttpPost]
        public async Task<ActionResult<Rol>> CreateRol(Rol rol)
        {
            try
            {
                // Validar que el nombre del rol no exista
                var rolExistente = await _context.Roles
                    .FirstOrDefaultAsync(r => r.NombreRol.ToLower() == rol.NombreRol.ToLower());

                if (rolExistente != null)
                {
                    return BadRequest(new { message = "Ya existe un rol con ese nombre" });
                }

                // Establecer fecha de registro
                rol.FechaRegistro = DateTime.Now;

                _context.Roles.Add(rol);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetRol), new { id = rol.Id }, rol);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PUT: api/roles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRol(int id, Rol rol)
        {
            if (id != rol.Id)
            {
                return BadRequest(new { message = "El ID del rol no coincide" });
            }

            try
            {
                // Verificar que el rol existe
                var rolExistente = await _context.Roles.FindAsync(id);
                if (rolExistente == null)
                {
                    return NotFound(new { message = "Rol no encontrado" });
                }

                // Validar que el nombre del rol no exista en otro registro
                var rolConMismoNombre = await _context.Roles
                    .FirstOrDefaultAsync(r => r.NombreRol.ToLower() == rol.NombreRol.ToLower() && r.Id != id);

                if (rolConMismoNombre != null)
                {
                    return BadRequest(new { message = "Ya existe otro rol con ese nombre" });
                }

                // Actualizar propiedades
                rolExistente.NombreRol = rol.NombreRol;
                rolExistente.Descripcion = rol.Descripcion;
                rolExistente.Activo = rol.Activo;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Rol actualizado correctamente", rol = rolExistente });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RolExists(id))
                {
                    return NotFound(new { message = "Rol no encontrado" });
                }
                else
                {
                    return StatusCode(500, new { message = "Error de concurrencia al actualizar el rol" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // DELETE: api/roles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRol(int id)
        {
            try
            {
                var rol = await _context.Roles.FindAsync(id);
                if (rol == null)
                {
                    return NotFound(new { message = "Rol no encontrado" });
                }

                // Verificar si el rol tiene usuarios asociados
                var tieneUsuarios = await _context.Usuarios.AnyAsync(u => u.IdRol == id);
                if (tieneUsuarios)
                {
                    return BadRequest(new { message = "No se puede eliminar el rol porque tiene usuarios asociados" });
                }

                // Eliminación permanente de la base de datos
                _context.Roles.Remove(rol);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Rol eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        private bool RolExists(int id)
        {
            return _context.Roles.Any(e => e.Id == id);
        }
    }
}