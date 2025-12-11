using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PetLove.Infrastructure.Data;
using PetLove.API.Middleware;
using PetLove.API.Services;
using SendGrid;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Usar configuración de Kestrel definida en appsettings/appsettings.Development.json
// (Se elimina el forzado de puerto para evitar conflictos y permitir 8090 en Development)
var portEnv = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(portEnv))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{portEnv}");
    Console.WriteLine($"Kestrel bound to 0.0.0.0:{portEnv}");
}

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();

// Configurar Swagger con soporte para JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PetLove API", Version = "v1" });
    
    // Configurar JWT en Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Configurar Entity Framework con PostgreSQL, SQL Server o InMemory
var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDb");
var usePostgreSQL = builder.Configuration.GetValue<bool>("UsePostgreSQL");

var sqlServerConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

var postgresConnection = builder.Configuration.GetConnectionString("PostgreSQLConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__PostgreSQLConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL");

if (useInMemory)
{
    Console.WriteLine("⚙️ Usando InMemoryDatabase para desarrollo");
    builder.Services.AddDbContext<PetLoveDbContext>(options =>
        options
            .UseInMemoryDatabase("PetLoveDev")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
    );
}
else if (usePostgreSQL)
{
    Console.WriteLine("🐘 Usando PostgreSQL para producción");
    builder.Services.AddDbContext<PetLoveDbContext>(options =>
        options.UseNpgsql(postgresConnection,
            npgsqlOptions => {
                // Usar el mismo ensamblado de migraciones del proyecto actual
                npgsqlOptions.MigrationsAssembly("PetLove.API");
                npgsqlOptions.CommandTimeout(300);
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorCodesToAdd: null);
            }));
}
else
{
    Console.WriteLine("🗄️ Usando SQL Server para desarrollo local");
    builder.Services.AddDbContext<PetLoveDbContext>(options =>
        options.UseSqlServer(sqlServerConnection,
            sqlOptions => {
                sqlOptions.MigrationsAssembly("PetLove.API");
                sqlOptions.CommandTimeout(300);
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            }));
}

// Registrar servicios personalizados
builder.Services.AddScoped<DatabaseInitializer>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();

var emailProvider = builder.Configuration["EmailProvider"] ?? "SendGrid";
var sendGridApiKey = builder.Configuration["SendGrid:ApiKey"];
var sendGridUseEu = (builder.Configuration["SendGrid:UseEu"] ?? "false").Equals("true", StringComparison.OrdinalIgnoreCase);
var sendGridBaseUrl = builder.Configuration["SendGrid:BaseUrl"] ?? (sendGridUseEu ? "https://api.sendgrid.eu" : "https://api.sendgrid.com");
var gmailUsername = builder.Configuration["Gmail:Username"] ?? string.Empty;
var gmailAppPassword = builder.Configuration["Gmail:AppPassword"] ?? string.Empty;

var hasValidSendGrid = !string.IsNullOrEmpty(sendGridApiKey) && sendGridApiKey != "YOUR_SENDGRID_API_KEY_HERE" && sendGridApiKey.StartsWith("SG.");
var hasValidGmail = !string.IsNullOrWhiteSpace(gmailUsername) && !string.IsNullOrWhiteSpace(gmailAppPassword);

if (hasValidSendGrid)
{
    var options = new SendGrid.SendGridClientOptions
    {
        ApiKey = sendGridApiKey,
        Host = sendGridBaseUrl
    };
    builder.Services.AddSingleton<ISendGridClient>(provider => new SendGrid.SendGridClient(options));
    builder.Services.AddScoped<EmailService>();
    Console.WriteLine($"✅ SendGrid listo (host: {sendGridBaseUrl})");
}
else
{
    Console.WriteLine("⚠️ SendGrid no configurado correctamente");
}

if (hasValidGmail)
{
    builder.Services.AddScoped<GmailSmtpEmailService>();
    Console.WriteLine("✅ Gmail SMTP listo (smtp.gmail.com:587)");
}
else
{
    Console.WriteLine("⚠️ Gmail SMTP no configurado correctamente");
}

if (hasValidSendGrid || hasValidGmail)
{
    builder.Services.AddScoped<IEmailService, FailoverEmailService>();
    Console.WriteLine(emailProvider.Equals("GmailSmtp", StringComparison.OrdinalIgnoreCase)
        ? "🟢 Preferencia: Gmail SMTP"
        : "🟢 Preferencia: SendGrid");
}
else
{
    builder.Services.AddScoped<IEmailService, MockEmailService>();
    Console.WriteLine("⚠️ Usando MockEmailService - Los correos NO se enviarán realmente");
}

builder.Services.AddLogging();

// Configurar JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            
            var response = new
            {
                exitoso = false,
                mensaje = "Token inválido o expirado",
                codigo = 401
            };

            return context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        },
        OnForbidden = context =>
        {
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            
            var response = new
            {
                exitoso = false,
                mensaje = "Acceso denegado: permisos insuficientes",
                codigo = 403
            };

            return context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        }
    };
});

builder.Services.AddAuthorization();

// Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5175",
                           "http://localhost:5173", "http://localhost:5174", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// Habilitar Swagger en todos los entornos para desarrollo y pruebas
app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection(); // Comentado para desarrollo local

// Usar CORS
app.UseCors("AllowReactApp");

// Configurar archivos estáticos para servir imágenes
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(app.Environment.ContentRootPath, "uploads")),
    RequestPath = "/uploads"
});

// Usar middleware de autenticación y autorización
app.UseAuthentication();

// Ejecutar JWT middleware antes de la autorización para adjuntar el usuario al contexto
app.UseMiddleware<JwtMiddleware>();

// Autorización del framework
app.UseAuthorization();

// Manejo de respuestas personalizadas para 401/403
app.UseMiddleware<CustomAuthorizationMiddleware>();

app.MapControllers();

// Inicializar la base de datos y datos esenciales
using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    var dbContext = scope.ServiceProvider.GetRequiredService<PetLoveDbContext>();

    // Aplicar migraciones automáticamente en proveedores relacionales (SQL Server / PostgreSQL)
    // Esto asegura que el esquema esté actualizado incluso en Desarrollo
    if (dbContext.Database.IsRelational())
    {
        try
        {
            await dbContext.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Migraciones fallaron: {ex.Message}. Intentando EnsureCreated para continuar en desarrollo.");
            try
            {
                await dbContext.Database.EnsureCreatedAsync();
                Console.WriteLine("✅ EnsureCreated completado. Continuando con la inicialización de datos.");
            }
            catch (Exception ex2)
            {
                Console.WriteLine($"❌ EnsureCreated también falló: {ex2.Message}");
            }
        }
    }

    await initializer.InitializeAsync();
}

app.Run();
