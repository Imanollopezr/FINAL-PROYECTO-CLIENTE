using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using PetLove.Infrastructure.Data;
using System;
using System.IO;

namespace PetLove.API
{
    // Factory para crear PetLoveDbContext en tiempo de diseño (migraciones)
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<PetLoveDbContext>
    {
        public PetLoveDbContext CreateDbContext(string[] args)
        {
            // Construir configuración desde appsettings.json y variables de entorno
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile($"appsettings.{environment}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var useInMemory = configuration.GetValue<bool>("UseInMemoryDb");
            var usePostgreSQL = configuration.GetValue<bool>("UsePostgreSQL");

            var optionsBuilder = new DbContextOptionsBuilder<PetLoveDbContext>();

            var sqlServerConnection = configuration.GetConnectionString("DefaultConnection")
                ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                ?? Environment.GetEnvironmentVariable("DATABASE_URL");

            var postgresConnection = configuration.GetConnectionString("PostgreSQLConnection")
                ?? Environment.GetEnvironmentVariable("ConnectionStrings__PostgreSQLConnection")
                ?? Environment.GetEnvironmentVariable("DATABASE_URL");
            
            if (usePostgreSQL)
            {
                // Usar PostgreSQL para migraciones de producción
                var connectionString = postgresConnection;
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    // Fallback para PostgreSQL local
                    connectionString = "Host=localhost;Database=PetLove;Username=postgres;Password=postgres";
                }

                optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
                {
                    npgsqlOptions.MigrationsAssembly("PetLove.API.PostgresMigrations");
                    npgsqlOptions.CommandTimeout(300);
                    npgsqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(30), null);
                });
            }
            else
            {
                // Usar SQL Server para desarrollo local
                var connectionString = sqlServerConnection;
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    // Fallback por si no hay cadena: intentar SQLEXPRESS por defecto
                    connectionString = "Server=.\\SQLEXPRESS;Database=PetLove;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true";
                }

                optionsBuilder.UseSqlServer(connectionString, sqlOptions =>
                {
                    sqlOptions.MigrationsAssembly("PetLove.API");
                    sqlOptions.CommandTimeout(300);
                    sqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(30), null);
                });
            }

            return new PetLoveDbContext(optionsBuilder.Options);
        }
    }
}