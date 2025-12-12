namespace PetLove.API.Services
{
    public class MockEmailService : IEmailService
    {
        private readonly ILogger<MockEmailService> _logger;

        public MockEmailService(ILogger<MockEmailService> logger)
        {
            _logger = logger;
        }

        public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string resetToken)
        {
            _logger.LogInformation("=== MOCK EMAIL SERVICE ===");
            _logger.LogInformation("Email de recuperación de contraseña:");
            _logger.LogInformation("Para: {Email}", toEmail);
            _logger.LogInformation("Usuario: {UserName}", userName);
            _logger.LogInformation("Token: {Token}", resetToken);
            _logger.LogInformation("URL de recuperación: http://localhost:5175/reset-password?token={Token}", resetToken);
            _logger.LogInformation("=========================");

            // Simular delay de envío
            await Task.Delay(100);
            return true;
        }

        public async Task<bool> SendPasswordResetCodeAsync(string toEmail, string userName, string code, IEnumerable<string>? modules = null)
        {
            _logger.LogInformation("=== MOCK EMAIL SERVICE ===");
            _logger.LogInformation("Código de recuperación de contraseña:");
            _logger.LogInformation("Para: {Email}", toEmail);
            _logger.LogInformation("Usuario: {UserName}", userName);
            _logger.LogInformation("Código: {Code}", code);
            var mods = modules == null ? string.Empty : string.Join(", ", modules);
            _logger.LogInformation("Módulos: {Modules}", string.IsNullOrWhiteSpace(mods) ? "(ninguno)" : mods);
            _logger.LogInformation("=========================");

            // Simular delay de envío
            await Task.Delay(100);
            return true;
        }

        public async Task<bool> SendWelcomeEmailAsync(string toEmail, string userName, IEnumerable<string> modules)
        {
            _logger.LogInformation("=== MOCK EMAIL SERVICE ===");
            _logger.LogInformation("Email de bienvenida:");
            _logger.LogInformation("Para: {Email}", toEmail);
            _logger.LogInformation("Usuario: {UserName}", userName);
            var mods = modules == null ? string.Empty : string.Join(", ", modules);
            _logger.LogInformation("Módulos: {Modules}", string.IsNullOrWhiteSpace(mods) ? "(ninguno)" : mods);
            _logger.LogInformation("=========================");

            // Simular delay de envío
            await Task.Delay(100);
            return true;
        }
    }
}
