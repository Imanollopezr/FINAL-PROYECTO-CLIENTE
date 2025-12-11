using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PetLove.Infrastructure.Data;
using System.Security.Claims;

namespace PetLove.API.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequireRoleAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string[] _roles;

        public RequireRoleAttribute(params string[] roles)
        {
            _roles = roles ?? throw new ArgumentNullException(nameof(roles));
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Verificar si el usuario está autenticado
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

            // Obtener el rol del usuario desde los claims (soportar diferentes nombres)
            var userRoleClaim =
                context.HttpContext.User.FindFirst("NombreRol")?.Value ??
                context.HttpContext.User.FindFirst("role")?.Value ??
                context.HttpContext.User.FindFirst("rol")?.Value;
            
            if (string.IsNullOrEmpty(userRoleClaim))
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

            // Verificar si el usuario tiene uno de los roles requeridos
            if (!_roles.Contains(userRoleClaim, StringComparer.OrdinalIgnoreCase))
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

    // Atributos específicos para roles comunes
    public class RequireAdminAttribute : RequireRoleAttribute
    {
        public RequireAdminAttribute() : base("Administrador", "Asistente", "Admin") { }
    }

    public class RequireAsistenteAttribute : RequireRoleAttribute
    {
        public RequireAsistenteAttribute() : base("Asistente", "Administrador", "Admin") { }
    }

    public class RequireUsuarioAttribute : RequireRoleAttribute
    {
        public RequireUsuarioAttribute() : base("Usuario", "Asistente", "Administrador", "Admin") { }
    }

    public class RequireClienteAttribute : RequireRoleAttribute
    {
        public RequireClienteAttribute() : base("Cliente", "Usuario", "Asistente", "Administrador", "Admin") { }
    }
}