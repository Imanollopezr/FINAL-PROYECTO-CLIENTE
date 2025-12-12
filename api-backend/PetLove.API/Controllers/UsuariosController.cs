using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.Services;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly PetLoveDbContext _context;
        private readonly IPasswordService _passwordService;
        private readonly IEmailService _emailService;

        public UsuariosController(PetLoveDbContext context, IPasswordService passwordService, IEmailService emailService)
        {
            _context = context;
            _passwordService = passwordService;
            _emailService = emailService;
        }

        public class UpdateImagenUsuarioDto
        {
            public string ImagenUrl { get; set; } = string.Empty;
        }

        // PUT: api/usuarios/mi-imagen
        [HttpPut("mi-imagen")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> UpdateMiImagen([FromBody] UpdateImagenUsuarioDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.ImagenUrl))
                {
                    return BadRequest(new { message = "Debe proporcionar una URL de imagen válida" });
                }

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Token inválido" });
                }

                var usuario = await _context.Usuarios.FindAsync(userId);
                if (usuario == null || !usuario.Activo)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                usuario.ImagenUrl = dto.ImagenUrl.Trim();
                await _context.SaveChangesAsync();

                return Ok(new { message = "Imagen de usuario actualizada", imagenUrl = usuario.ImagenUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/usuarios
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetUsuarios()
        {
            try
            {
                var usuarios = await _context.Usuarios
                    .Include(u => u.Rol)
                    .Select(u => new
                    {
                        u.Id,
                        u.Nombres,
                        u.Apellidos,
                        u.Correo,
                        u.IdRol,
                        NombreRol = u.Rol.NombreRol,
                        u.Activo,
                        u.FechaRegistro
                    })
                    .OrderBy(u => u.Nombres)
                    .ToListAsync();

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/usuarios/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetUsuario(int id)
        {
            try
            {
                var usuario = await _context.Usuarios
                    .Include(u => u.Rol)
                    .Where(u => u.Id == id)
                    .Select(u => new
                    {
                        u.Id,
                        u.Nombres,
                        u.Apellidos,
                        u.Correo,
                        u.IdRol,
                        NombreRol = u.Rol.NombreRol,
                        u.Activo,
                        u.FechaRegistro
                    })
                    .FirstOrDefaultAsync();

                if (usuario == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                return Ok(usuario);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/usuarios/buscar/{termino}
        [HttpGet("buscar/{termino}")]
        public async Task<ActionResult<IEnumerable<object>>> BuscarUsuarios(string termino)
        {
            try
            {
                var usuarios = await _context.Usuarios
                    .Include(u => u.Rol)
                    .Where(u => u.Nombres.Contains(termino) || 
                               u.Apellidos.Contains(termino) || 
                               u.Correo.Contains(termino) ||
                               u.Rol.NombreRol.Contains(termino))
                    .Select(u => new
                    {
                        u.Id,
                        u.Nombres,
                        u.Apellidos,
                        u.Correo,
                        u.IdRol,
                        NombreRol = u.Rol.NombreRol,
                        u.Activo,
                        u.FechaRegistro
                    })
                    .OrderBy(u => u.Nombres)
                    .ToListAsync();

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // POST: api/usuarios
        [HttpPost]
        public async Task<ActionResult<Usuario>> CreateUsuario(CreateUsuarioDto usuarioDto)
        {
            try
            {
                // Validaciones de datos
                if (string.IsNullOrWhiteSpace(usuarioDto.Nombres) || usuarioDto.Nombres.Length < 2)
                {
                    return BadRequest(new { message = "El nombre debe tener al menos 2 caracteres" });
                }

                if (string.IsNullOrWhiteSpace(usuarioDto.Apellidos) || usuarioDto.Apellidos.Length < 2)
                {
                    return BadRequest(new { message = "Los apellidos deben tener al menos 2 caracteres" });
                }

                if (string.IsNullOrWhiteSpace(usuarioDto.Correo) || !IsValidEmail(usuarioDto.Correo))
                {
                    return BadRequest(new { message = "Debe proporcionar un correo electrónico válido" });
                }

                if (string.IsNullOrWhiteSpace(usuarioDto.Clave) || usuarioDto.Clave.Length < 6)
                {
                    return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres" });
                }

                if (usuarioDto.IdRol <= 0)
                {
                    return BadRequest(new { message = "Debe especificar un rol válido" });
                }

                // Validar que el correo no exista
                var usuarioExistente = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Correo.ToLower() == usuarioDto.Correo.ToLower());

                if (usuarioExistente != null)
                {
                    return BadRequest(new { message = "Ya existe un usuario con ese correo electrónico" });
                }

                // Validar que el rol exista
                var rolExistente = await _context.Roles.FindAsync(usuarioDto.IdRol);
                if (rolExistente == null)
                {
                    return BadRequest(new { message = "El rol especificado no existe" });
                }

                // Crear el nuevo usuario
                var usuario = new Usuario
                {
                    Nombres = usuarioDto.Nombres.Trim(),
                    Apellidos = usuarioDto.Apellidos.Trim(),
                    Correo = usuarioDto.Correo.ToLower().Trim(),
                    Clave = _passwordService.HashPassword(usuarioDto.Clave),
                    IdRol = usuarioDto.IdRol,
                    Activo = usuarioDto.Activo,
                    FechaRegistro = DateTime.Now
                };

                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                // Enviar email de bienvenida (no bloquea el flujo si falla)
                try
                {
                    var nombreUsuario = $"{usuario.Nombres} {usuario.Apellidos}".Trim();
                    var permisos = await _context.PermisosRol
                        .Where(pr => pr.RolId == usuario.IdRol)
                        .Include(pr => pr.Permiso)
                        .Select(pr => pr.Permiso.Nombre)
                        .ToListAsync();

                    var enviado = await _emailService.SendWelcomeEmailAsync(
                        usuario.Correo,
                        string.IsNullOrWhiteSpace(nombreUsuario) ? usuario.Nombres : nombreUsuario,
                        permisos
                    );
                    if (!enviado)
                    {
                        // Loggear advertencia si no se envía
                    }
                }
                catch
                {
                    // Silenciar para no romper el flujo de creación
                }

                try
                {
                    var random = new Random();
                    var codigo = random.Next(100000, 999999).ToString();

                    var passwordResetToken = new PasswordResetToken
                    {
                        Codigo = codigo,
                        UsuarioId = usuario.Id,
                        FechaExpiracion = DateTime.UtcNow.AddHours(1)
                    };

                    _context.PasswordResetTokens.Add(passwordResetToken);
                    await _context.SaveChangesAsync();

                    var nombreUsuario2 = $"{usuario.Nombres} {usuario.Apellidos}".Trim();
                    var permisos2 = await _context.PermisosRol
                        .Where(pr => pr.RolId == usuario.IdRol)
                        .Include(pr => pr.Permiso)
                        .Select(pr => pr.Permiso.Nombre)
                        .ToListAsync();

                    await _emailService.SendPasswordResetCodeAsync(
                        usuario.Correo,
                        string.IsNullOrWhiteSpace(nombreUsuario2) ? usuario.Nombres : nombreUsuario2,
                        codigo,
                        permisos2
                    );
                }
                catch
                {
                }

                // Retornar el usuario sin la contraseña
                var usuarioCreado = await _context.Usuarios
                    .Include(u => u.Rol)
                    .Where(u => u.Id == usuario.Id)
                    .Select(u => new
                    {
                        u.Id,
                        u.Nombres,
                        u.Apellidos,
                        u.Correo,
                        u.IdRol,
                        NombreRol = u.Rol.NombreRol,
                        u.Activo,
                        u.FechaRegistro
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, usuarioCreado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // PUT: api/usuarios/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUsuario(int id, UpdateUsuarioDto usuarioDto)
        {
            try
            {
                // Validaciones de datos
                if (string.IsNullOrWhiteSpace(usuarioDto.Nombres) || usuarioDto.Nombres.Length < 2)
                {
                    return BadRequest(new { message = "El nombre debe tener al menos 2 caracteres" });
                }

                if (string.IsNullOrWhiteSpace(usuarioDto.Apellidos) || usuarioDto.Apellidos.Length < 2)
                {
                    return BadRequest(new { message = "Los apellidos deben tener al menos 2 caracteres" });
                }

                if (string.IsNullOrWhiteSpace(usuarioDto.Correo) || !IsValidEmail(usuarioDto.Correo))
                {
                    return BadRequest(new { message = "Debe proporcionar un correo electrónico válido" });
                }

                // Validar contraseña solo si se proporciona
                if (!string.IsNullOrEmpty(usuarioDto.Clave) && usuarioDto.Clave.Length < 6)
                {
                    return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres" });
                }

                if (usuarioDto.IdRol <= 0)
                {
                    return BadRequest(new { message = "Debe especificar un rol válido" });
                }

                // Verificar que el usuario existe
                var usuarioExistente = await _context.Usuarios.FindAsync(id);
                if (usuarioExistente == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                // Validar que el correo no exista en otro registro
                var usuarioConMismoCorreo = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Correo.ToLower() == usuarioDto.Correo.ToLower() && u.Id != id);

                if (usuarioConMismoCorreo != null)
                {
                    return BadRequest(new { message = "Ya existe otro usuario con ese correo electrónico" });
                }

                // Validar que el rol existe
                var rolExiste = await _context.Roles.AnyAsync(r => r.Id == usuarioDto.IdRol && r.Activo);
                if (!rolExiste)
                {
                    return BadRequest(new { message = "El rol especificado no existe o está inactivo" });
                }

                // Actualizar propiedades
                usuarioExistente.Nombres = usuarioDto.Nombres.Trim();
                usuarioExistente.Apellidos = usuarioDto.Apellidos.Trim();
                usuarioExistente.Correo = usuarioDto.Correo.ToLower().Trim();
                usuarioExistente.IdRol = usuarioDto.IdRol;
                usuarioExistente.Activo = usuarioDto.Activo;

                // Solo actualizar la contraseña si se proporciona una nueva
                if (!string.IsNullOrEmpty(usuarioDto.Clave))
                {
                    usuarioExistente.Clave = _passwordService.HashPassword(usuarioDto.Clave);
                }

                await _context.SaveChangesAsync();

                // Retornar el usuario actualizado sin la contraseña
                var usuarioActualizado = await _context.Usuarios
                    .Include(u => u.Rol)
                    .Where(u => u.Id == id)
                    .Select(u => new
                    {
                        u.Id,
                        u.Nombres,
                        u.Apellidos,
                        u.Correo,
                        u.IdRol,
                        NombreRol = u.Rol.NombreRol,
                        u.Activo,
                        u.FechaRegistro
                    })
                    .FirstOrDefaultAsync();

                return Ok(new { message = "Usuario actualizado correctamente", usuario = usuarioActualizado });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UsuarioExists(id))
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }
                else
                {
                    return StatusCode(500, new { message = "Error de concurrencia al actualizar el usuario" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        // DELETE: api/usuarios/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            try
            {
                var usuario = await _context.Usuarios.FindAsync(id);
                if (usuario == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                // Eliminación permanente de la base de datos
                _context.Usuarios.Remove(usuario);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Usuario eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        private bool UsuarioExists(int id)
        {
            return _context.Usuarios.Any(e => e.Id == id);
        }

        // Método auxiliar para validar email
        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}

// DTO para crear usuario
public class CreateUsuarioDto
{
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Clave { get; set; } = string.Empty;
    public int IdRol { get; set; }
    public bool Activo { get; set; } = true;
}

// DTO para actualizar usuario
public class UpdateUsuarioDto
{
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string? Clave { get; set; } // Opcional para actualización
    public int IdRol { get; set; }
    public bool Activo { get; set; } = true;
}
