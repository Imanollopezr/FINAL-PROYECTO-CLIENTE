using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PetLove.API.Services
{
    public class FailoverEmailService : IEmailService
    {
        private readonly EmailService? _sendGridService;
        private readonly GmailSmtpEmailService? _gmailService;
        private readonly ILogger<FailoverEmailService> _logger;
        private readonly bool _preferGmail;
        private readonly IServiceProvider _serviceProvider;

        public FailoverEmailService(IServiceProvider serviceProvider, IConfiguration configuration, ILogger<FailoverEmailService> logger)
        {
            _serviceProvider = serviceProvider;
            _sendGridService = _serviceProvider.GetService<EmailService>();
            _gmailService = _serviceProvider.GetService<GmailSmtpEmailService>();
            _logger = logger;
            var provider = configuration["EmailProvider"] ?? "SendGrid";
            _preferGmail = provider.Equals("GmailSmtp", StringComparison.OrdinalIgnoreCase);
        }

        public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string resetToken)
        {
            if (_preferGmail)
            {
                if (_gmailService != null && await _gmailService.SendPasswordResetEmailAsync(toEmail, userName, resetToken)) return true;
                if (_sendGridService != null && await _sendGridService.SendPasswordResetEmailAsync(toEmail, userName, resetToken)) return true;
            }
            else
            {
                if (_sendGridService != null && await _sendGridService.SendPasswordResetEmailAsync(toEmail, userName, resetToken)) return true;
                if (_gmailService != null && await _gmailService.SendPasswordResetEmailAsync(toEmail, userName, resetToken)) return true;
            }
            _logger.LogWarning("No se pudo enviar el email de recuperación a {Email}", toEmail);
            return false;
        }

        public async Task<bool> SendPasswordResetCodeAsync(string toEmail, string userName, string code, IEnumerable<string>? modules = null)
        {
            if (_preferGmail)
            {
                if (_gmailService != null && await _gmailService.SendPasswordResetCodeAsync(toEmail, userName, code, modules)) return true;
                if (_sendGridService != null && await _sendGridService.SendPasswordResetCodeAsync(toEmail, userName, code, modules)) return true;
            }
            else
            {
                if (_sendGridService != null && await _sendGridService.SendPasswordResetCodeAsync(toEmail, userName, code, modules)) return true;
                if (_gmailService != null && await _gmailService.SendPasswordResetCodeAsync(toEmail, userName, code, modules)) return true;
            }
            _logger.LogWarning("No se pudo enviar el código de verificación a {Email}", toEmail);
            return false;
        }

        public async Task<bool> SendWelcomeEmailAsync(string toEmail, string userName, IEnumerable<string> modules)
        {
            if (_preferGmail)
            {
                if (_gmailService != null && await _gmailService.SendWelcomeEmailAsync(toEmail, userName, modules)) return true;
                if (_sendGridService != null && await _sendGridService.SendWelcomeEmailAsync(toEmail, userName, modules)) return true;
            }
            else
            {
                if (_sendGridService != null && await _sendGridService.SendWelcomeEmailAsync(toEmail, userName, modules)) return true;
                if (_gmailService != null && await _gmailService.SendWelcomeEmailAsync(toEmail, userName, modules)) return true;
            }
            _logger.LogWarning("No se pudo enviar el email de bienvenida a {Email}", toEmail);
            return false;
        }
    }
}
