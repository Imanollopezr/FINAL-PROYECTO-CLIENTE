using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PetLove.API.Services
{
    public class GmailSmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<GmailSmtpEmailService> _logger;
        private readonly string _username;
        private readonly string _appPassword;
        private readonly string _fromName;
        private readonly string _frontendUrl;

        public GmailSmtpEmailService(IConfiguration configuration, ILogger<GmailSmtpEmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _username = _configuration["Gmail:Username"] ?? string.Empty;
            _appPassword = _configuration["Gmail:AppPassword"] ?? string.Empty;
            _fromName = _configuration["SendGrid:FromName"] ?? "PetLove";
            _frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5175";
        }

        private SmtpClient CreateClient()
        {
            var client = new SmtpClient("smtp.gmail.com", 587)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_username, _appPassword)
            };
            return client;
        }

        private MailMessage CreateMessage(string toEmail, string subject, string htmlBody, string plainBody)
        {
            var msg = new MailMessage
            {
                From = new MailAddress(_username, _fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            msg.To.Add(new MailAddress(toEmail));
            // AlternateView for plain text
            var plainView = AlternateView.CreateAlternateViewFromString(plainBody, null, "text/plain");
            msg.AlternateViews.Add(plainView);
            return msg;
        }

        public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string resetToken)
        {
            try
            {
                var resetUrl = $"{_frontendUrl}/reset-password?token={resetToken}";
                var html = GetPasswordResetHtmlTemplate(userName, resetUrl);
                var plain = GetPasswordResetPlainTextTemplate(userName, resetUrl);
                using var msg = CreateMessage(toEmail, "Recuperación de Contraseña - PetLove", html, plain);
                using var client = CreateClient();
                await client.SendMailAsync(msg);
                _logger.LogInformation("[GmailSMTP] Email de recuperación enviado a {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GmailSMTP] Error enviando email de recuperación a {Email}", toEmail);
                return false;
            }
        }

        public async Task<bool> SendPasswordResetCodeAsync(string toEmail, string userName, string code, IEnumerable<string>? modules = null)
        {
            try
            {
                var html = GetPasswordResetCodeHtmlTemplate(userName, code, modules ?? Array.Empty<string>());
                var plain = GetPasswordResetCodePlainTextTemplate(userName, code, modules ?? Array.Empty<string>());
                using var msg = CreateMessage(toEmail, "Código de verificación - PetLove", html, plain);
                using var client = CreateClient();
                await client.SendMailAsync(msg);
                _logger.LogInformation("[GmailSMTP] Código de verificación enviado a {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GmailSMTP] Error enviando código de verificación a {Email}", toEmail);
                return false;
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string toEmail, string userName, IEnumerable<string> modules)
        {
            try
            {
                var html = GetWelcomeHtmlTemplate(userName, modules ?? Array.Empty<string>());
                var plain = GetWelcomePlainTextTemplate(userName, modules ?? Array.Empty<string>());
                using var msg = CreateMessage(toEmail, "Bienvenido a PetLove - Tu cuenta está lista", html, plain);
                using var client = CreateClient();
                await client.SendMailAsync(msg);
                _logger.LogInformation("[GmailSMTP] Email de bienvenida enviado a {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GmailSMTP] Error enviando email de bienvenida a {Email}", toEmail);
                return false;
            }
        }

        // Templates reutilizados (simplificados)
        private string GetPasswordResetCodeHtmlTemplate(string userName, string code, IEnumerable<string> modules)
        {
            var mods = modules?.Any() == true ? $"<p style='margin-top:12px'>Módulos: {string.Join(", ", modules)}</p>" : string.Empty;
            return $@"<html><body><h2>🐾 PetLove</h2><p>Hola {WebUtility.HtmlEncode(userName)},</p><p>Tu código de verificación:</p><div style='font-size:28px;font-weight:bold;background:#FFD166;display:inline-block;padding:10px 16px;border-radius:8px;color:#1a1a1a;'>{WebUtility.HtmlEncode(code)}</div>{mods}<p>Válido por 1 hora.</p></body></html>";
        }

        private string GetPasswordResetCodePlainTextTemplate(string userName, string code, IEnumerable<string> modules)
        {
            var mods = modules?.Any() == true ? "\nMódulos:\n- " + string.Join("\n- ", modules) + "\n" : string.Empty;
            return $@"PetLove\nHola {userName}\n\nCódigo de verificación:\n{code}\n{mods}Válido por 1 hora.";
        }

        private string GetPasswordResetHtmlTemplate(string userName, string resetUrl)
        {
            return $@"<html><body><h2>🐾 PetLove</h2><p>Hola {WebUtility.HtmlEncode(userName)},</p><p>Para restablecer tu contraseña, haz clic:</p><p><a href='{WebUtility.HtmlEncode(resetUrl)}' style='background:#FFD166;padding:10px 16px;border-radius:8px;color:#1a1a1a;text-decoration:none;'>Restablecer Contraseña</a></p><p>Si no funciona, copia este enlace:</p><p style='word-break:break-all'>{WebUtility.HtmlEncode(resetUrl)}</p></body></html>";
        }

        private string GetPasswordResetPlainTextTemplate(string userName, string resetUrl)
        {
            return $@"PetLove - Recuperación de contraseña\nHola {userName}\n\nEnlace: {resetUrl}";
        }

        private string GetWelcomeHtmlTemplate(string userName, IEnumerable<string> modules)
        {
            var mods = modules?.Any() == true ? $"<p>Módulos habilitados: {string.Join(", ", modules)}</p>" : string.Empty;
            return $@"<html><body><h2>🐾 Bienvenido a PetLove</h2><p>Hola {WebUtility.HtmlEncode(userName)}, tu cuenta está lista.</p>{mods}</body></html>";
        }

        private string GetWelcomePlainTextTemplate(string userName, IEnumerable<string> modules)
        {
            var mods = modules?.Any() == true ? "\nMódulos habilitados:\n- " + string.Join("\n- ", modules) : string.Empty;
            return $@"Bienvenido a PetLove\nHola {userName}\nTu cuenta está lista.{mods}";
        }
    }
}
