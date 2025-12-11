using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace PetLove.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArchivosController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ArchivosController> _logger;

        // Extensiones permitidas para imágenes
        private readonly string[] _extensionesPermitidas = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        
        // Tamaño máximo: 5MB
        private const long TamañoMaximo = 5 * 1024 * 1024;

        public ArchivosController(IWebHostEnvironment environment, ILogger<ArchivosController> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        /// <summary>
        /// Sube una imagen y devuelve la URL para acceder a ella
        /// </summary>
        /// <param name="archivo">Archivo de imagen a subir</param>
        /// <returns>URL de la imagen subida</returns>
        [HttpPost("subir-imagen")]
        public async Task<IActionResult> SubirImagen([Required] IFormFile archivo)
        {
            try
            {
                // Validar que se envió un archivo
                if (archivo == null || archivo.Length == 0)
                {
                    return BadRequest(new { message = "No se ha seleccionado ningún archivo" });
                }

                // Validar tamaño del archivo
                if (archivo.Length > TamañoMaximo)
                {
                    return BadRequest(new { message = $"El archivo es demasiado grande. Tamaño máximo permitido: {TamañoMaximo / (1024 * 1024)}MB" });
                }

                // Validar extensión del archivo
                var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
                if (!_extensionesPermitidas.Contains(extension))
                {
                    return BadRequest(new { message = $"Tipo de archivo no permitido. Extensiones permitidas: {string.Join(", ", _extensionesPermitidas)}" });
                }

                // Validar que es realmente una imagen
                if (!archivo.ContentType.StartsWith("image/"))
                {
                    return BadRequest(new { message = "El archivo debe ser una imagen válida" });
                }

                // Crear directorio de uploads si no existe
                var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "productos");
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                // Generar nombre único para el archivo
                var nombreArchivo = $"{Guid.NewGuid()}{extension}";
                var rutaCompleta = Path.Combine(uploadsPath, nombreArchivo);

                // Guardar el archivo
                using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                {
                    await archivo.CopyToAsync(stream);
                }

                // Generar URL para acceder al archivo
                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var urlImagen = $"{baseUrl}/uploads/productos/{nombreArchivo}";

                _logger.LogInformation($"Imagen subida exitosamente: {nombreArchivo}");

                return Ok(new 
                { 
                    message = "Imagen subida exitosamente",
                    url = urlImagen,
                    nombreArchivo = nombreArchivo,
                    tamaño = archivo.Length,
                    tipo = archivo.ContentType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir imagen");
                return StatusCode(500, new { message = "Error interno del servidor al subir la imagen" });
            }
        }

        /// <summary>
        /// Sube un avatar de usuario y devuelve la URL para acceder a él
        /// </summary>
        /// <param name="archivo">Archivo de imagen a subir</param>
        /// <returns>URL del avatar subido</returns>
        [HttpPost("subir-avatar")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> SubirAvatar([Required] IFormFile archivo)
        {
            try
            {
                if (archivo == null || archivo.Length == 0)
                {
                    return BadRequest(new { message = "No se ha seleccionado ningún archivo" });
                }

                if (archivo.Length > TamañoMaximo)
                {
                    return BadRequest(new { message = $"El archivo es demasiado grande. Tamaño máximo permitido: {TamañoMaximo / (1024 * 1024)}MB" });
                }

                var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
                if (!_extensionesPermitidas.Contains(extension))
                {
                    return BadRequest(new { message = $"Tipo de archivo no permitido. Extensiones permitidas: {string.Join(", ", _extensionesPermitidas)}" });
                }

                if (!archivo.ContentType.StartsWith("image/"))
                {
                    return BadRequest(new { message = "El archivo debe ser una imagen válida" });
                }

                var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "usuarios");
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                var nombreArchivo = $"{Guid.NewGuid()}{extension}";
                var rutaCompleta = Path.Combine(uploadsPath, nombreArchivo);

                using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                {
                    await archivo.CopyToAsync(stream);
                }

                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var urlImagen = $"{baseUrl}/uploads/usuarios/{nombreArchivo}";

                _logger.LogInformation($"Avatar subido exitosamente: {nombreArchivo}");

                return Ok(new
                {
                    message = "Avatar subido exitosamente",
                    url = urlImagen,
                    nombreArchivo = nombreArchivo,
                    tamaño = archivo.Length,
                    tipo = archivo.ContentType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir avatar");
                return StatusCode(500, new { message = "Error interno del servidor al subir el avatar" });
            }
        }

        /// <summary>
        /// Elimina un avatar del servidor
        /// </summary>
        /// <param name="nombreArchivo">Nombre del archivo a eliminar</param>
        /// <returns>Resultado de la operación</returns>
        [HttpDelete("eliminar-avatar/{nombreArchivo}")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public IActionResult EliminarAvatar(string nombreArchivo)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(nombreArchivo))
                {
                    return BadRequest(new { message = "Nombre de archivo no válido" });
                }

                var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "usuarios");
                var rutaCompleta = Path.Combine(uploadsPath, nombreArchivo);

                if (!System.IO.File.Exists(rutaCompleta))
                {
                    return NotFound(new { message = "Archivo no encontrado" });
                }

                System.IO.File.Delete(rutaCompleta);

                _logger.LogInformation($"Avatar eliminado exitosamente: {nombreArchivo}");

                return Ok(new { message = "Avatar eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al eliminar avatar: {nombreArchivo}");
                return StatusCode(500, new { message = "Error interno del servidor al eliminar el avatar" });
            }
        }

        /// <summary>
        /// Obtiene información de un avatar
        /// </summary>
        /// <param name="nombreArchivo">Nombre del archivo</param>
        /// <returns>Información del archivo</returns>
        [HttpGet("info-avatar/{nombreArchivo}")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public IActionResult ObtenerInfoAvatar(string nombreArchivo)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(nombreArchivo))
                {
                    return BadRequest(new { message = "Nombre de archivo no válido" });
                }

                var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "usuarios");
                var rutaCompleta = Path.Combine(uploadsPath, nombreArchivo);

                if (!System.IO.File.Exists(rutaCompleta))
                {
                    return NotFound(new { message = "Archivo no encontrado" });
                }

                var fileInfo = new FileInfo(rutaCompleta);
                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var urlImagen = $"{baseUrl}/uploads/usuarios/{nombreArchivo}";

                return Ok(new
                {
                    nombreArchivo = nombreArchivo,
                    url = urlImagen,
                    tamaño = fileInfo.Length,
                    fechaCreacion = fileInfo.CreationTime,
                    fechaModificacion = fileInfo.LastWriteTime
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener información de avatar: {nombreArchivo}");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }
        /// <summary>
        /// Elimina una imagen del servidor
        /// </summary>
        /// <param name="nombreArchivo">Nombre del archivo a eliminar</param>
        /// <returns>Resultado de la operación</returns>
        [HttpDelete("eliminar-imagen/{nombreArchivo}")]
        public IActionResult EliminarImagen(string nombreArchivo)
        {
            try
            {
                // Validar nombre del archivo
                if (string.IsNullOrWhiteSpace(nombreArchivo))
                {
                    return BadRequest(new { message = "Nombre de archivo no válido" });
                }

                // Construir ruta del archivo
                var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "productos");
                var rutaCompleta = Path.Combine(uploadsPath, nombreArchivo);

                // Verificar que el archivo existe
                if (!System.IO.File.Exists(rutaCompleta))
                {
                    return NotFound(new { message = "Archivo no encontrado" });
                }

                // Eliminar el archivo
                System.IO.File.Delete(rutaCompleta);

                _logger.LogInformation($"Imagen eliminada exitosamente: {nombreArchivo}");

                return Ok(new { message = "Imagen eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al eliminar imagen: {nombreArchivo}");
                return StatusCode(500, new { message = "Error interno del servidor al eliminar la imagen" });
            }
        }

        /// <summary>
        /// Obtiene información de una imagen
        /// </summary>
        /// <param name="nombreArchivo">Nombre del archivo</param>
        /// <returns>Información del archivo</returns>
        [HttpGet("info-imagen/{nombreArchivo}")]
        public IActionResult ObtenerInfoImagen(string nombreArchivo)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(nombreArchivo))
                {
                    return BadRequest(new { message = "Nombre de archivo no válido" });
                }

                var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "productos");
                var rutaCompleta = Path.Combine(uploadsPath, nombreArchivo);

                if (!System.IO.File.Exists(rutaCompleta))
                {
                    return NotFound(new { message = "Archivo no encontrado" });
                }

                var fileInfo = new FileInfo(rutaCompleta);
                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var urlImagen = $"{baseUrl}/uploads/productos/{nombreArchivo}";

                return Ok(new
                {
                    nombreArchivo = nombreArchivo,
                    url = urlImagen,
                    tamaño = fileInfo.Length,
                    fechaCreacion = fileInfo.CreationTime,
                    fechaModificacion = fileInfo.LastWriteTime
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener información de imagen: {nombreArchivo}");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }
    }
}