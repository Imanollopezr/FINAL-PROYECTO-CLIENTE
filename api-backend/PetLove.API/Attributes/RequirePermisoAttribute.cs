using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using PetLove.Infrastructure.Data;

namespace PetLove.API.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequirePermisoAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string[] _permisos;

        public RequirePermisoAttribute(params string[] permisos)
        {
            _permisos = permisos ?? Array.Empty<string>();
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Verificar autenticación
            if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new JsonResult(new
                {
                    exitoso = false,
                    mensaje = "Token inválido o expirado",
                    codigo = 401
                })
                {
                    StatusCode = 401
                };
                return;
            }

            // Si no se definieron permisos, permitir acceso
            if (_permisos.Length == 0)
            {
                return;
            }

            // Obtener IdRol desde claims (tolerante a distintos nombres)
            var idRolStr =
                context.HttpContext.User.FindFirst("IdRol")?.Value ??
                context.HttpContext.User.FindFirst("RolId")?.Value ??
                context.HttpContext.User.FindFirst("role_id")?.Value;

            if (string.IsNullOrWhiteSpace(idRolStr) || !int.TryParse(idRolStr, out var idRol))
            {
                context.Result = new JsonResult(new
                {
                    exitoso = false,
                    mensaje = "Acceso denegado: permisos insuficientes",
                    codigo = 403
                })
                {
                    StatusCode = 403
                };
                return;
            }

            // Resolver DbContext desde el contenedor
            var db = context.HttpContext.RequestServices.GetService(typeof(PetLoveDbContext)) as PetLoveDbContext;
            if (db == null)
            {
                context.Result = new JsonResult(new
                {
                    exitoso = false,
                    mensaje = "Acceso denegado: servicio de datos no disponible",
                    codigo = 403
                })
                {
                    StatusCode = 403
                };
                return;
            }

            // Normalizar lista de permisos requeridos a minúsculas
            var required = _permisos.Select(p => p.Trim()).Where(p => !string.IsNullOrEmpty(p)).Select(p => p.ToLower()).ToList();

            // Verificar si el rol del usuario tiene cualquiera de los permisos requeridos
            var hasPermiso = db.PermisosRol
                .Include(pr => pr.Permiso)
                .Any(pr => pr.RolId == idRol && required.Contains(pr.Permiso.Nombre.ToLower()));

            if (!hasPermiso)
            {
                context.Result = new JsonResult(new
                {
                    exitoso = false,
                    mensaje = "Acceso denegado: permisos insuficientes",
                    codigo = 403
                })
                {
                    StatusCode = 403
                };
                return;
            }
        }
    }
}