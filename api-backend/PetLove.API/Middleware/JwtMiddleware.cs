using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using PetLove.API.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PetLove.API.Middleware
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;
        private readonly ILogger<JwtMiddleware> _logger;

        public JwtMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<JwtMiddleware> logger)
        {
            _next = next;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var token = ExtractTokenFromHeader(context);

            if (!string.IsNullOrEmpty(token))
            {
                AttachUserToContext(context, token);
            }

            await _next(context);
        }

        private string? ExtractTokenFromHeader(HttpContext context)
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            
            if (authHeader != null && authHeader.StartsWith("Bearer "))
            {
                return authHeader.Substring("Bearer ".Length).Trim();
            }

            return null;
        }

        private void AttachUserToContext(HttpContext context, string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var configuredKey = _configuration["Jwt:Key"] ?? _configuration["Jwt:SecretKey"];
                if (string.IsNullOrWhiteSpace(configuredKey))
                {
                    throw new InvalidOperationException("JWT Key not configured");
                }
                var key = Encoding.ASCII.GetBytes(configuredKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"] ?? "PetLove.API",
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"] ?? "PetLove.Client",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);

                if (validatedToken is JwtSecurityToken jwtToken)
                {
                    // Verificar que el token sea válido y no haya sido manipulado
                    if (jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                    {
                        context.User = principal;
                    }
                }
            }
            catch (SecurityTokenExpiredException)
            {
                _logger.LogWarning("Token expirado para la solicitud: {Path}", context.Request.Path);
                // No adjuntar usuario al contexto si el token está expirado
            }
            catch (SecurityTokenException ex)
            {
                _logger.LogWarning(ex, "Token inválido para la solicitud: {Path}", context.Request.Path);
                // No adjuntar usuario al contexto si el token es inválido
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al validar token para la solicitud: {Path}", context.Request.Path);
                // No adjuntar usuario al contexto si hay un error
            }
        }
    }

    // Clase para manejar respuestas de autorización personalizadas
    public class CustomAuthorizationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<CustomAuthorizationMiddleware> _logger;

        public CustomAuthorizationMiddleware(RequestDelegate next, ILogger<CustomAuthorizationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            await _next(context);

            // Manejar respuestas de autorización
            if (context.Response.StatusCode == 401)
            {
                await HandleUnauthorizedAsync(context);
            }
            else if (context.Response.StatusCode == 403)
            {
                await HandleForbiddenAsync(context);
            }
        }

        private async Task HandleUnauthorizedAsync(HttpContext context)
        {
            if (!context.Response.HasStarted)
            {
                context.Response.ContentType = "application/json";
                
                var response = new
                {
                    exitoso = false,
                    mensaje = "Token inválido o expirado",
                    codigo = 401
                };

                await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
            }
        }

        private async Task HandleForbiddenAsync(HttpContext context)
        {
            if (!context.Response.HasStarted)
            {
                context.Response.ContentType = "application/json";
                
                var response = new
                {
                    exitoso = false,
                    mensaje = "Acceso denegado: permisos insuficientes",
                    codigo = 403
                };

                await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
            }
        }
    }
}