using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using PetLove.Core.Models;

namespace PetLove.API.Services
{
    public interface IJwtService
    {
        string GenerateToken(Usuario usuario);
        string GenerateRefreshToken();
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
        bool ValidateToken(string token);
    }

    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly int _tokenExpirationMinutes;
        private readonly int _refreshTokenExpirationDays;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
            var configuredKey = _configuration["Jwt:Key"] ?? _configuration["Jwt:SecretKey"];
            if (string.IsNullOrWhiteSpace(configuredKey))
            {
                throw new InvalidOperationException("JWT Key not configured");
            }

            _secretKey = configuredKey;
            _issuer = _configuration["Jwt:Issuer"] ?? "PetLove.API";
            _audience = _configuration["Jwt:Audience"] ?? "PetLove.Client";

            // Align expiration with appsettings.json keys
            var expiryHoursStr = _configuration["Jwt:ExpiryInHours"];
            if (int.TryParse(expiryHoursStr, out var expiryHours))
            {
                _tokenExpirationMinutes = expiryHours * 60;
            }
            else
            {
                _tokenExpirationMinutes = 60; // default 1 hour
            }

            var refreshDaysStr = _configuration["Jwt:RefreshTokenExpiryInDays"];
            if (int.TryParse(refreshDaysStr, out var refreshDays))
            {
                _refreshTokenExpirationDays = refreshDays;
            }
            else
            {
                _refreshTokenExpirationDays = 7; // default 7 days
            }
        }

        public string GenerateToken(Usuario usuario)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secretKey);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, $"{usuario.Nombres} {usuario.Apellidos}"),
                new Claim(ClaimTypes.Email, usuario.Correo),
                new Claim("IdRol", usuario.IdRol.ToString()),
                new Claim("NombreRol", usuario.Rol?.NombreRol ?? "Usuario"),
                new Claim("Activo", usuario.Activo.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, 
                    new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(), 
                    ClaimValueTypes.Integer64)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_tokenExpirationMinutes),
                Issuer = _issuer,
                Audience = _audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key), 
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidateIssuer = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_secretKey)),
                ValidateLifetime = false, // No validar expiración para refresh
                ValidIssuer = _issuer,
                ValidAudience = _audience,
                ClockSkew = TimeSpan.Zero
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            
            if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Token inválido");
            }

            return principal;
        }

        public bool ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_secretKey);

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _issuer,
                    ValidateAudience = true,
                    ValidAudience = _audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}