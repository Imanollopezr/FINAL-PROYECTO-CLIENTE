using System.Text.RegularExpressions;

namespace PetLove.API.Utils
{
    public static class ValidationHelper
    {
        /// <summary>
        /// Valida si un email tiene un formato válido
        /// </summary>
        /// <param name="email">Email a validar</param>
        /// <returns>True si el email es válido, False en caso contrario</returns>
        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
                return emailRegex.IsMatch(email);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Valida si un texto tiene la longitud mínima requerida
        /// </summary>
        /// <param name="text">Texto a validar</param>
        /// <param name="minLength">Longitud mínima requerida</param>
        /// <returns>True si cumple con la longitud mínima, False en caso contrario</returns>
        public static bool HasMinLength(string text, int minLength)
        {
            return !string.IsNullOrWhiteSpace(text) && text.Trim().Length >= minLength;
        }

        /// <summary>
        /// Valida si un texto tiene una longitud dentro del rango permitido
        /// </summary>
        /// <param name="text">Texto a validar</param>
        /// <param name="minLength">Longitud mínima</param>
        /// <param name="maxLength">Longitud máxima</param>
        /// <returns>True si está dentro del rango, False en caso contrario</returns>
        public static bool IsLengthInRange(string text, int minLength, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(text))
                return false;

            var length = text.Trim().Length;
            return length >= minLength && length <= maxLength;
        }

        /// <summary>
        /// Valida si un texto contiene solo letras y espacios
        /// </summary>
        /// <param name="text">Texto a validar</param>
        /// <returns>True si solo contiene letras y espacios, False en caso contrario</returns>
        public static bool IsOnlyLettersAndSpaces(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return false;

            var regex = new Regex(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$");
            return regex.IsMatch(text);
        }

        /// <summary>
        /// Valida si un texto contiene solo números
        /// </summary>
        /// <param name="text">Texto a validar</param>
        /// <returns>True si solo contiene números, False en caso contrario</returns>
        public static bool IsOnlyNumbers(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return false;

            var regex = new Regex(@"^[0-9]+$");
            return regex.IsMatch(text);
        }

        /// <summary>
        /// Valida si un RUC tiene un formato válido (11 dígitos)
        /// </summary>
        /// <param name="ruc">RUC a validar</param>
        /// <returns>True si el RUC es válido, False en caso contrario</returns>
        public static bool IsValidRUC(string ruc)
        {
            if (string.IsNullOrWhiteSpace(ruc))
                return false;

            // RUC debe tener exactamente 11 dígitos
            var regex = new Regex(@"^[0-9]{11}$");
            return regex.IsMatch(ruc.Trim());
        }

        /// <summary>
        /// Valida si un documento de identidad tiene un formato válido (8 dígitos)
        /// </summary>
        /// <param name="documento">Documento a validar</param>
        /// <returns>True si el documento es válido, False en caso contrario</returns>
        public static bool IsValidDocumento(string documento)
        {
            if (string.IsNullOrWhiteSpace(documento))
                return false;

            // Documento debe tener exactamente 8 dígitos
            var regex = new Regex(@"^[0-9]{8}$");
            return regex.IsMatch(documento.Trim());
        }

        /// <summary>
        /// Valida si un número de teléfono tiene un formato válido
        /// </summary>
        /// <param name="telefono">Teléfono a validar</param>
        /// <returns>True si el teléfono es válido, False en caso contrario</returns>
        public static bool IsValidTelefono(string telefono)
        {
            if (string.IsNullOrWhiteSpace(telefono))
                return false;

            // Teléfono puede tener 7-15 dígitos, con posibles espacios, guiones o paréntesis
            var regex = new Regex(@"^[\d\s\-\(\)\+]{7,15}$");
            return regex.IsMatch(telefono.Trim());
        }

        /// <summary>
        /// Normaliza un texto eliminando espacios extra y convirtiendo a formato título
        /// </summary>
        /// <param name="text">Texto a normalizar</param>
        /// <returns>Texto normalizado</returns>
        public static string NormalizeText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            return text.Trim();
        }

        /// <summary>
        /// Normaliza un nombre propio (primera letra mayúscula)
        /// </summary>
        /// <param name="name">Nombre a normalizar</param>
        /// <returns>Nombre normalizado</returns>
        public static string NormalizeName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return string.Empty;

            var normalized = name.Trim().ToLower();
            if (normalized.Length > 0)
            {
                return char.ToUpper(normalized[0]) + normalized.Substring(1);
            }
            return normalized;
        }

        /// <summary>
        /// Valida si un precio es válido (mayor a 0)
        /// </summary>
        /// <param name="precio">Precio a validar</param>
        /// <returns>True si el precio es válido, False en caso contrario</returns>
        public static bool IsValidPrice(decimal precio)
        {
            return precio > 0;
        }

        /// <summary>
        /// Valida si un stock es válido (mayor o igual a 0)
        /// </summary>
        /// <param name="stock">Stock a validar</param>
        /// <returns>True si el stock es válido, False en caso contrario</returns>
        public static bool IsValidStock(int stock)
        {
            return stock >= 0;
        }
    }
}