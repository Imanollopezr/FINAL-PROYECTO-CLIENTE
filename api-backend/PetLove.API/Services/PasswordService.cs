using BCrypt.Net;

namespace PetLove.API.Services
{
    public interface IPasswordService
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string hashedPassword);
        string GenerateRandomPassword(int length = 12);
    }

    public class PasswordService : IPasswordService
    {
        public string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                throw new ArgumentException("La contraseña no puede estar vacía", nameof(password));

            return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hashedPassword))
                return false;

            try
            {
                return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
            }
            catch
            {
                return false;
            }
        }

        public string GenerateRandomPassword(int length = 12)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, length)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}