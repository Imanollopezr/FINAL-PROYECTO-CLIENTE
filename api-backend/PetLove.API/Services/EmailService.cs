using SendGrid;
using SendGrid.Helpers.Mail;
using System.Linq;

namespace PetLove.API.Services
{
    public interface IEmailService
    {
        Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string resetToken);
        Task<bool> SendPasswordResetCodeAsync(string toEmail, string userName, string code, IEnumerable<string>? modules = null);
        Task<bool> SendWelcomeEmailAsync(string toEmail, string userName, IEnumerable<string> modules);
    }

    public class EmailService : IEmailService
    {
        private readonly ISendGridClient _sendGridClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly string _frontendUrl;

        public EmailService(ISendGridClient sendGridClient, IConfiguration configuration, ILogger<EmailService> logger)
        {
            _sendGridClient = sendGridClient;
            _configuration = configuration;
            _logger = logger;
            _fromEmail = _configuration["SendGrid:FromEmail"] ?? "noreply@petlove.com";
            _fromName = _configuration["SendGrid:FromName"] ?? "PetLove";
            _frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5175";
        }

        public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string resetToken)
        {
            try
            {
                var from = new EmailAddress(_fromEmail, _fromName);
                var to = new EmailAddress(toEmail, userName);
                var subject = "Recuperación de Contraseña - PetLove";

                var resetUrl = $"{_frontendUrl}/reset-password?token={resetToken}";

                var htmlContent = GetPasswordResetHtmlTemplate(userName, resetUrl);
                var plainTextContent = GetPasswordResetPlainTextTemplate(userName, resetUrl);

                var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
                
                msg.SetReplyTo(new EmailAddress(_fromEmail, _fromName));
                msg.AddCategory("password-reset");
                msg.SetClickTracking(false, false);
                msg.SetOpenTracking(false);
                msg.SetGoogleAnalytics(false);
                msg.SetSubscriptionTracking(false);

                var response = await _sendGridClient.SendEmailAsync(msg);
                var body = await response.Body.ReadAsStringAsync();

                if (response.StatusCode == System.Net.HttpStatusCode.Accepted)
                {
                    _logger.LogInformation("Email de recuperación enviado exitosamente a {Email}", toEmail);
                    return true;
                }
                else
                {
                    _logger.LogError("Error al enviar email de recuperación a {Email}. Status: {Status}. Body: {Body}", toEmail, response.StatusCode, body);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción al enviar email de recuperación a {Email}", toEmail);
                return false;
            }
        }

        public async Task<bool> SendPasswordResetCodeAsync(string toEmail, string userName, string code, IEnumerable<string>? modules = null)
        {
            try
            {
                var from = new EmailAddress(_fromEmail, _fromName);
                var to = new EmailAddress(toEmail, userName);
                var subject = "Código de verificación - PetLove";
                var mappedModules = MapModules(modules ?? Array.Empty<string>());

                // Forzar uso de HTML embebido (no usar plantilla dinámica de SendGrid)
                _logger.LogInformation("EmailService: TemplateId ignorado; usando HTML embebido para código de verificación");
                var htmlContent = GetPasswordResetCodeHtmlTemplate(userName, code, mappedModules);
                var plainTextContent = GetPasswordResetCodePlainTextTemplate(userName, code, mappedModules);
                var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
                
                msg.SetReplyTo(new EmailAddress(_fromEmail, _fromName));
                msg.AddCategory("verification-code");
                msg.SetClickTracking(false, false);
                msg.SetOpenTracking(false);
                msg.SetGoogleAnalytics(false);
                msg.SetSubscriptionTracking(false);

                var response = await _sendGridClient.SendEmailAsync(msg);
                var body = await response.Body.ReadAsStringAsync();

                if (response.StatusCode == System.Net.HttpStatusCode.Accepted)
                {
                    _logger.LogInformation("Código de recuperación enviado exitosamente a {Email}", toEmail);
                    return true;
                }
                else
                {
                    _logger.LogError("Error al enviar código de recuperación a {Email}. Status: {Status}. Body: {Body}", toEmail, response.StatusCode, body);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción al enviar código de recuperación a {Email}", toEmail);
                return false;
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string toEmail, string userName, IEnumerable<string> modules)
        {
            try
            {
                var from = new EmailAddress(_fromEmail, _fromName);
                var to = new EmailAddress(toEmail, userName);
                var subject = "Bienvenido a PetLove - Tu cuenta está lista";

                var mappedModules = MapModules(modules ?? Array.Empty<string>());
                var htmlContent = GetWelcomeHtmlTemplate(userName, mappedModules);
                var plainTextContent = GetWelcomePlainTextTemplate(userName, mappedModules);

                var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
                
                msg.SetReplyTo(new EmailAddress(_fromEmail, _fromName));
                msg.AddCategory("welcome");
                msg.SetClickTracking(false, false);
                msg.SetOpenTracking(false);
                msg.SetGoogleAnalytics(false);
                msg.SetSubscriptionTracking(false);

                var response = await _sendGridClient.SendEmailAsync(msg);
                var body = await response.Body.ReadAsStringAsync();

                if (response.StatusCode == System.Net.HttpStatusCode.Accepted)
                {
                    _logger.LogInformation("Email de bienvenida enviado exitosamente a {Email}", toEmail);
                    return true;
                }
                else
                {
                    _logger.LogError("Error al enviar email de bienvenida a {Email}. Status: {Status}. Body: {Body}", toEmail, response.StatusCode, body);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción al enviar email de bienvenida a {Email}", toEmail);
                return false;
            }
        }

        private IEnumerable<string> MapModules(IEnumerable<string> permissions)
        {
            // Mapea nombres internos de permisos a nombres amigables de módulos
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "GestionRoles", "Gestión de Roles" },
                { "GestionUsuarios", "Gestión de Usuarios" },
                { "VerDashboard", "Dashboard" },
                { "Perfil", "Perfil" },
                { "VerLanding", "Landing" },
                { "GestionClientes", "Gestión de Clientes" },
                { "GestionProveedores", "Gestión de Proveedores" },
                { "GestionCategorias", "Gestión de Categorías" },
                { "GestionMarcas", "Gestión de Marcas" },
                { "GestionMedidas", "Gestión de Medidas" },
                { "GestionProductos", "Gestión de Productos" },
                { "GestionCompras", "Gestión de Compras" },
                { "GestionVentas", "Gestión de Ventas" }
            };

            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var p in permissions)
            {
                if (string.IsNullOrWhiteSpace(p)) continue;
                if (map.TryGetValue(p.Trim(), out var friendly))
                {
                    set.Add(friendly);
                }
                else
                {
                    // Fallback: separar PascalCase en palabras
                    var words = System.Text.RegularExpressions.Regex.Replace(p.Trim(), "([a-z])([A-Z])", "$1 $2");
                    set.Add(words);
                }
            }
            var list = new List<string>(set);
            list.Sort(StringComparer.OrdinalIgnoreCase);
            return list;
        }

        private string GetPasswordResetCodeHtmlTemplate(string userName, string code, IEnumerable<string> modules)
        {
            return $@"
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>🌟 Código de Verificación</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }}
        .container {{ background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #FFD166 0%, #F7C948 100%); color: #2B2D42; padding: 40px 30px; text-align: center; }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 24px; color: #333; margin-bottom: 20px; }}
        .message {{ font-size: 16px; color: #666; margin-bottom: 30px; line-height: 1.8; }}
        .code-container {{ text-align: center; margin: 30px 0; }}
        .code {{ display: inline-block; background: #FFD166; color: #1a1a1a; padding: 20px 30px; border-radius: 12px; font-size: 28px; font-weight: bold; letter-spacing: 6px; box-shadow: 0 5px 15px rgba(0,0,0,0.15); }}
        .warning {{ background: #FFF8E6; border-left: 4px solid #FFD166; padding: 20px; border-radius: 8px; margin: 30px 0; }}
        .footer {{ text-align: center; color: #999; font-size: 14px; padding: 20px; background: #f8f9fa; }}
        .signature {{ margin-top: 30px; font-style: italic; color: #06D6A0; }}
        .modules {{ background: #E6F8F5; border-left: 4px solid #06D6A0; padding: 16px; border-radius: 8px; margin-top: 24px; }}
        .modules h3 {{ margin: 0 0 8px 0; font-size: 16px; color: #2B2D42; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🐾 PetLove</h1>
            <p style='margin: 0; font-size: 18px; opacity: 0.9;'>Tu código de verificación está listo</p>
        </div>
        <div class='content'>
            <div class='greeting'>Hola {userName},</div>
            <div class='message'>
                Hemos recibido una solicitud para acceder a tu cuenta de PetLove.<br><br>
                Para continuar de forma segura, utiliza el siguiente código de verificación:
            </div>
            <div class='code-container'>
                <span class='code'>{code}</span>
            </div>
            {(modules != null && modules.Any() ? $"<div class='modules'><h3>Módulos habilitados</h3><ul>{string.Join("", modules.Select(m => $"<li>{System.Net.WebUtility.HtmlEncode(m)}</li>"))}</ul></div>" : string.Empty)}
            <div class='warning'>
                <p><strong>Información importante:</strong></p>
                <p>Este código es válido por <strong>1 hora</strong> únicamente.</p>
                <p>Si no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.</p>
            </div>
            <div class='signature'>
                Saludos cordiales,<br>
                <strong>Equipo de PetLove</strong>
            </div>
        </div>
        <div class='footer'>
            <p>Este email fue enviado automáticamente, por favor no respondas.</p>
            <p>© 2024 PetLove - Sistema de Gestión de Mascotas</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GetPasswordResetCodePlainTextTemplate(string userName, string code, IEnumerable<string> modules)
        {
            return $@"
CÓDIGO DE VERIFICACIÓN - PETLOVE

Hola {userName},

Hemos recibido una solicitud para acceder a tu cuenta de PetLove.

Para continuar de forma segura, utiliza el siguiente código de verificación:

{code}

 {(modules != null && modules.Any() ? "Módulos habilitados:\n" + string.Join("\n", modules.Select(m => $"- {m}")) + "\n\n" : string.Empty)}
INFORMACIÓN IMPORTANTE:
Este código es válido por 1 hora únicamente.

Si no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.

Saludos cordiales,
Equipo de PetLove

---
Este email fue enviado automáticamente, por favor no respondas.
© 2024 PetLove - Sistema de Gestión de Mascotas
";
        }

        private string GetPasswordResetHtmlTemplate(string userName, string resetUrl)
        {
            return $@"
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Recuperación de Contraseña</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #2B2D42; color: #FFFFFF; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #FFD166; color: #1a1a1a; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.12); }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        .warning {{ background: #FFF8E6; border-left: 4px solid #FFD166; padding: 15px; border-radius: 8px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>🐾 PetLove</h1>
        <h2>Recuperación de Contraseña</h2>
    </div>
    <div class='content'>
        <p>Hola <strong>{userName}</strong>,</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en PetLove.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <p style='text-align: center;'>
            <a href='{resetUrl}' class='button'>Restablecer Contraseña</a>
        </p>
        <div class='warning'>
            <p><strong>⚠️ Importante:</strong></p>
            <ul>
                <li>Este enlace expirará en <strong>1 hora</strong></li>
                <li>Si no solicitaste este cambio, puedes ignorar este email</li>
                <li>Por seguridad, nunca compartas este enlace con nadie</li>
            </ul>
        </div>
        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style='word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;'>{resetUrl}</p>
    </div>
    <div class='footer'>
        <p>Este email fue enviado automáticamente, por favor no respondas.</p>
        <p>© 2024 PetLove - Sistema de Gestión de Mascotas</p>
    </div>
</body>
</html>";
        }

        private string GetPasswordResetPlainTextTemplate(string userName, string resetUrl)
        {
            return $@"
PetLove - Recuperación de Contraseña

Hola {userName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en PetLove.

Para crear una nueva contraseña, visita el siguiente enlace:
{resetUrl}

IMPORTANTE:
- Este enlace expirará en 1 hora
- Si no solicitaste este cambio, puedes ignorar este email
- Por seguridad, nunca compartas este enlace con nadie

Este email fue enviado automáticamente, por favor no respondas.
© 2024 PetLove - Sistema de Gestión de Mascotas
";
        }

        private string GetWelcomeHtmlTemplate(string userName, IEnumerable<string> modules)
        {
            return $@"
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Bienvenido a PetLove</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #FFD166 0%, #F7C948 100%); color: #2B2D42; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .feature {{ background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #FFD166; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>🐾 ¡Bienvenido a PetLove!</h1>
    </div>
    <div class='content'>
        <p>bienvenido a petlove</p>
        <p>Hola <strong>{userName}</strong>,</p>
        <p>¡Nos alegra tenerte en nuestra comunidad! Tu cuenta ha sido creada exitosamente.</p>
        <div class='feature'>
            <h3>🔐 Módulos habilitados para tu rol</h3>
            <p>Estos son los módulos a los que tienes acceso:</p>
            <ul>
                {string.Join("", (modules ?? Array.Empty<string>()).Select(m => $"<li>{System.Net.WebUtility.HtmlEncode(m)}</li>"))}
            </ul>
        </div>
        
        <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
        <p>¡Esperamos que disfrutes usando PetLove!</p>
    </div>
    <div class='footer'>
        <p>Este email fue enviado automáticamente, por favor no respondas.</p>
        <p>© 2024 PetLove - Sistema de Gestión de Mascotas</p>
    </div>
</body>
</html>";
        }

        private string GetWelcomePlainTextTemplate(string userName, IEnumerable<string> modules)
        {
            return $@"
¡Bienvenido a PetLove!

Hola {userName},

bienvenido a petlove

¡Nos alegra tenerte en nuestra comunidad! Tu cuenta ha sido creada exitosamente.

Módulos habilitados para tu rol:
{string.Join("\n", (modules ?? Array.Empty<string>()).Select(m => $"- {m}"))}

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
¡Esperamos que disfrutes usando PetLove!

Este email fue enviado automáticamente, por favor no respondas.
© 2024 PetLove - Sistema de Gestión de Mascotas
";
        }
    }
}
