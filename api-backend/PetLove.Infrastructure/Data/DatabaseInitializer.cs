using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PetLove.Core.Models;

namespace PetLove.Infrastructure.Data
{
    public class DatabaseInitializer
    {
        private readonly PetLoveDbContext _context;
        private readonly ILogger<DatabaseInitializer> _logger;

        public DatabaseInitializer(PetLoveDbContext context, ILogger<DatabaseInitializer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task InitializeAsync()
        {
            try
            {
                // Ensure database is created for SQL Server if not present
                try
                {
                    if (_context.Database.IsSqlServer())
                    {
                        await _context.Database.EnsureCreatedAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "EnsureCreated failed; continuing to connection check.");
                }

                // Check if database exists and is accessible
                var canConnect = await _context.Database.CanConnectAsync();
                if (!canConnect)
                {
                    _logger.LogError("Cannot connect to database. Please check connection string.");
                    return;
                }

                _logger.LogInformation("Database connection successful. Skipping migrations for existing database.");

                // Initialize essential data
                await SeedInitialDataAsync();

                _logger.LogInformation("Database initialization completed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while initializing the database.");
                // Don't throw to allow the application to start even if database initialization fails
                _logger.LogWarning("Application will continue without database initialization.");
            }
        }

        private async Task SeedInitialDataAsync()
        {
            // Seed/Upsert ROLES: crear faltantes aunque existan algunos
            var requiredRoles = new[] { "Administrador", "Asistente", "Usuario", "Cliente" };
            var existingRoles = await _context.Roles.Select(r => r.NombreRol).ToListAsync();
            var missingRoles = requiredRoles.Except(existingRoles).ToList();
            if (missingRoles.Any())
            {
                var now = DateTime.Now;
                var rolesToAdd = new List<Rol>();
                if (missingRoles.Contains("Administrador"))
                    rolesToAdd.Add(new Rol { NombreRol = "Administrador", Descripcion = "Acceso completo al sistema", Activo = true, FechaRegistro = now });
                if (missingRoles.Contains("Asistente"))
                    rolesToAdd.Add(new Rol { NombreRol = "Asistente", Descripcion = "Acceso completo al sistema con permisos similares al administrador", Activo = true, FechaRegistro = now });
                if (missingRoles.Contains("Usuario"))
                    rolesToAdd.Add(new Rol { NombreRol = "Usuario", Descripcion = "Usuario estándar del sistema", Activo = true, FechaRegistro = now });
                if (missingRoles.Contains("Cliente"))
                    rolesToAdd.Add(new Rol { NombreRol = "Cliente", Descripcion = "Cliente del sistema con acceso limitado", Activo = true, FechaRegistro = now });

                await _context.Roles.AddRangeAsync(rolesToAdd);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Roles creados/actualizados: {Roles}", string.Join(", ", missingRoles));
            }

            // Seed PERMISOS base
            if (!await _context.Permisos.AnyAsync())
            {
                var permisos = new List<Permiso>
                {
                    new Permiso { Nombre = "GestionRoles", Descripcion = "Crear, editar, eliminar roles" },
                    new Permiso { Nombre = "GestionUsuarios", Descripcion = "Crear, editar, eliminar usuarios" },
                    new Permiso { Nombre = "VerDashboard", Descripcion = "Acceder al panel de control" },
                    new Permiso { Nombre = "GestionClientes", Descripcion = "CRUD clientes" },
                    new Permiso { Nombre = "GestionProveedores", Descripcion = "CRUD proveedores" },
                    new Permiso { Nombre = "GestionCategorias", Descripcion = "CRUD categorías" },
                    new Permiso { Nombre = "GestionMarcas", Descripcion = "CRUD marcas" },
                    new Permiso { Nombre = "GestionMedidas", Descripcion = "CRUD medidas" },
                    new Permiso { Nombre = "GestionProductos", Descripcion = "CRUD productos" },
                    new Permiso { Nombre = "GestionCompras", Descripcion = "CRUD compras" },
                    new Permiso { Nombre = "GestionVentas", Descripcion = "CRUD ventas" }
                };

                await _context.Permisos.AddRangeAsync(permisos);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Permisos seeded successfully.");
            }

            // Asignar permisos a roles si aún no existe mapeo
            if (!await _context.PermisosRol.AnyAsync())
            {
                var roles = await _context.Roles.ToListAsync();
                var permisos = await _context.Permisos.ToListAsync();

                Rol? admin = roles.FirstOrDefault(r => r.NombreRol == "Administrador");
                Rol? asistente = roles.FirstOrDefault(r => r.NombreRol == "Asistente");
                Rol? usuario = roles.FirstOrDefault(r => r.NombreRol == "Usuario");
                Rol? cliente = roles.FirstOrDefault(r => r.NombreRol == "Cliente");

                if (admin != null)
                {
                    foreach (var p in permisos)
                    {
                        _context.PermisosRol.Add(new PermisoRol { RolId = admin.Id, PermisoId = p.Id });
                    }
                }

                if (asistente != null)
                {
                    // Asistente: casi todos excepto gestión de roles
                    foreach (var p in permisos.Where(x => x.Nombre != "GestionRoles"))
                    {
                        _context.PermisosRol.Add(new PermisoRol { RolId = asistente.Id, PermisoId = p.Id });
                    }
                }

                if (usuario != null)
                {
                    // Usuario: ver dashboard y gestión básica de ventas (sin gestión de clientes)
                    foreach (var name in new[] { "VerDashboard", "GestionVentas" })
                    {
                        var p = permisos.FirstOrDefault(x => x.Nombre == name);
                        if (p != null) _context.PermisosRol.Add(new PermisoRol { RolId = usuario.Id, PermisoId = p.Id });
                    }
                }

                if (cliente != null)
                {
                    // Cliente: ver dashboard
                    var p = permisos.FirstOrDefault(x => x.Nombre == "VerDashboard");
                    if (p != null) _context.PermisosRol.Add(new PermisoRol { RolId = cliente.Id, PermisoId = p.Id });
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Permisos asignados a roles correctamente.");
            }

            // Asegurar mapeos mínimos de permisos por rol, incluso si ya existen algunos
            try
            {
                var allPermisos = await _context.Permisos.ToListAsync();
                var permisosByName = allPermisos.ToDictionary(p => p.Nombre, p => p);

                var adminRol = await _context.Roles.FirstOrDefaultAsync(r => r.NombreRol == "Administrador");
                var asistenteRol = await _context.Roles.FirstOrDefaultAsync(r => r.NombreRol == "Asistente");
                var usuarioRol = await _context.Roles.FirstOrDefaultAsync(r => r.NombreRol == "Usuario");
                var clienteRol = await _context.Roles.FirstOrDefaultAsync(r => r.NombreRol == "Cliente");

                // Helper local para agregar mapeo si falta
                async Task EnsurePermisoAsync(Rol? rol, string permisoNombre)
                {
                    if (rol == null) return;
                    if (!permisosByName.TryGetValue(permisoNombre, out var permiso)) return;

                    var exists = await _context.PermisosRol
                        .AnyAsync(pr => pr.RolId == rol.Id && pr.PermisoId == permiso.Id);
                    if (!exists)
                    {
                        _context.PermisosRol.Add(new PermisoRol { RolId = rol.Id, PermisoId = permiso.Id });
                    }
                }

                // Administrador: debe tener todos los permisos declarados
                if (adminRol != null)
                {
                    var adminPermIds = await _context.PermisosRol
                        .Where(pr => pr.RolId == adminRol.Id)
                        .Select(pr => pr.PermisoId)
                        .ToListAsync();
                    foreach (var p in allPermisos)
                    {
                        if (!adminPermIds.Contains(p.Id))
                        {
                            _context.PermisosRol.Add(new PermisoRol { RolId = adminRol.Id, PermisoId = p.Id });
                        }
                    }
                }

                // Asistente: todos excepto GestionRoles
                if (asistenteRol != null)
                {
                    var asistentePermIds = await _context.PermisosRol
                        .Where(pr => pr.RolId == asistenteRol.Id)
                        .Select(pr => pr.PermisoId)
                        .ToListAsync();
                    foreach (var p in allPermisos.Where(x => x.Nombre != "GestionRoles"))
                    {
                        if (!asistentePermIds.Contains(p.Id))
                        {
                            _context.PermisosRol.Add(new PermisoRol { RolId = asistenteRol.Id, PermisoId = p.Id });
                        }
                    }
                }

                // Usuario: VerDashboard y GestionVentas
                await EnsurePermisoAsync(usuarioRol, "VerDashboard");
                await EnsurePermisoAsync(usuarioRol, "GestionVentas");

                // Cliente: VerDashboard
                await EnsurePermisoAsync(clienteRol, "VerDashboard");

                await _context.SaveChangesAsync();
                _logger.LogInformation("Se aseguraron mapeos mínimos de permisos para roles existentes.");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudieron asegurar los permisos mínimos por rol.");
            }

            // Check if data already exists
            var categoriaExists = await _context.Categorias.AnyAsync();
            
            if (!categoriaExists)
            {
                // Seed CATEGORIA_PRODUCTO
                var categorias = new List<Categoria>
                {
                    new Categoria { Nombre = "Alimento para Perros", Descripcion = "Comida y snacks para perros", Activo = true, FechaRegistro = DateTime.Now },
                    new Categoria { Nombre = "Alimento para Gatos", Descripcion = "Comida y snacks para gatos", Activo = true, FechaRegistro = DateTime.Now },
                    new Categoria { Nombre = "Juguetes", Descripcion = "Juguetes para mascotas", Activo = true, FechaRegistro = DateTime.Now },
                    new Categoria { Nombre = "Accesorios", Descripcion = "Collares, correas y accesorios", Activo = true, FechaRegistro = DateTime.Now },
                    new Categoria { Nombre = "Higiene", Descripcion = "Productos de limpieza y cuidado", Activo = true, FechaRegistro = DateTime.Now }
                };

                await _context.Categorias.AddRangeAsync(categorias);

                // Seed MARCA
                var marcas = new List<Marca>
                {
                    new Marca { Nombre = "Royal Canin", Descripcion = "Marca premium de alimentos para mascotas", Activo = true, FechaRegistro = DateTime.Now },
                    new Marca { Nombre = "Pedigree", Descripcion = "Alimentos para perros", Activo = true, FechaRegistro = DateTime.Now },
                    new Marca { Nombre = "Whiskas", Descripcion = "Alimentos para gatos", Activo = true, FechaRegistro = DateTime.Now },
                    new Marca { Nombre = "Kong", Descripcion = "Juguetes resistentes para mascotas", Activo = true, FechaRegistro = DateTime.Now },
                    new Marca { Nombre = "Genérica", Descripcion = "Marca genérica", Activo = true, FechaRegistro = DateTime.Now }
                };

                await _context.Marcas.AddRangeAsync(marcas);

                // Seed MEDIDA
                var medidas = new List<Medida>
                {
                    new Medida { Nombre = "Kilogramo", Abreviatura = "kg", Descripcion = "Unidad de peso", Activo = true, FechaRegistro = DateTime.Now },
                    new Medida { Nombre = "Gramo", Abreviatura = "g", Descripcion = "Unidad de peso", Activo = true, FechaRegistro = DateTime.Now },
                    new Medida { Nombre = "Litro", Abreviatura = "L", Descripcion = "Unidad de volumen", Activo = true, FechaRegistro = DateTime.Now },
                    new Medida { Nombre = "Mililitro", Abreviatura = "ml", Descripcion = "Unidad de volumen", Activo = true, FechaRegistro = DateTime.Now },
                    new Medida { Nombre = "Unidad", Abreviatura = "und", Descripcion = "Unidad individual", Activo = true, FechaRegistro = DateTime.Now }
                };

                await _context.Medidas.AddRangeAsync(medidas);

                // Seed TIPO_DOCUMENTO
                var tipoDocumentos = new List<TipoDocumento>
                {
                    new TipoDocumento { Nombre = "Cédula de Ciudadanía", Descripcion = "Documento de identidad nacional", Activo = true, FechaRegistro = DateTime.Now },
                    new TipoDocumento { Nombre = "Cédula de Extranjería", Descripcion = "Documento para extranjeros", Activo = true, FechaRegistro = DateTime.Now },
                    new TipoDocumento { Nombre = "Pasaporte", Descripcion = "Documento de viaje internacional", Activo = true, FechaRegistro = DateTime.Now },
                    new TipoDocumento { Nombre = "NIT", Descripcion = "Número de Identificación Tributaria", Activo = true, FechaRegistro = DateTime.Now }
                };

                await _context.TipoDocumentos.AddRangeAsync(tipoDocumentos);

                // Seed METODO_PAGO
                var metodosPago = new List<MetodoPago>
                {
                    new MetodoPago { Nombre = "Efectivo", Descripcion = "Pago en efectivo", Activo = true, FechaRegistro = DateTime.Now },
                    new MetodoPago { Nombre = "Tarjeta de Crédito", Descripcion = "Pago con tarjeta de crédito", Activo = true, FechaRegistro = DateTime.Now },
                    new MetodoPago { Nombre = "Tarjeta de Débito", Descripcion = "Pago con tarjeta de débito", Activo = true, FechaRegistro = DateTime.Now },
                    new MetodoPago { Nombre = "Transferencia", Descripcion = "Transferencia bancaria", Activo = true, FechaRegistro = DateTime.Now },
                    new MetodoPago { Nombre = "PSE", Descripcion = "Pagos Seguros en Línea", Activo = true, FechaRegistro = DateTime.Now }
                };

                await _context.MetodosPago.AddRangeAsync(metodosPago);

                // Seed ESTADO
                var estados = new List<Estado>
                {
                    new Estado { Nombre = "Activo", Descripcion = "Estado activo", Activo = true, FechaRegistro = DateTime.Now },
                    new Estado { Nombre = "Inactivo", Descripcion = "Estado inactivo", Activo = true, FechaRegistro = DateTime.Now },
                    new Estado { Nombre = "Pendiente", Descripcion = "Estado pendiente", Activo = true, FechaRegistro = DateTime.Now },
                    new Estado { Nombre = "Completado", Descripcion = "Estado completado", Activo = true, FechaRegistro = DateTime.Now },
                    new Estado { Nombre = "Cancelado", Descripcion = "Estado cancelado", Activo = true, FechaRegistro = DateTime.Now }
                };

                await _context.Estados.AddRangeAsync(estados);

                // Seed CLIENTES de prueba
                if (!await _context.Clientes.AnyAsync())
                {
                    var clientes = new List<Cliente>
                    {
                        new Cliente { Nombre = "Juan", Apellido = "Pérez", Email = "juan.perez@email.com", Telefono = "3001234567", Documento = "12345678", Direccion = "Calle 123 #45-67", Ciudad = "Bogotá", CodigoPostal = "110111", Activo = true, FechaRegistro = DateTime.Now },
                        new Cliente { Nombre = "María", Apellido = "García", Email = "maria.garcia@email.com", Telefono = "3009876543", Documento = "87654321", Direccion = "Carrera 45 #12-34", Ciudad = "Medellín", CodigoPostal = "050001", Activo = true, FechaRegistro = DateTime.Now },
                        new Cliente { Nombre = "Carlos", Apellido = "López", Email = "carlos.lopez@email.com", Telefono = "3005555555", Documento = "11111111", Direccion = "Avenida 80 #23-45", Ciudad = "Cali", CodigoPostal = "760001", Activo = true, FechaRegistro = DateTime.Now }
                    };

                    await _context.Clientes.AddRangeAsync(clientes);
                }
            }
            
            // Asegurar que el rol Usuario no tenga el permiso 'GestionClientes'
            try
            {
                var usuarioRol = await _context.Roles.FirstOrDefaultAsync(r => r.NombreRol == "Usuario");
                var gestionClientesPermiso = await _context.Permisos.FirstOrDefaultAsync(p => p.Nombre == "GestionClientes");

                if (usuarioRol != null && gestionClientesPermiso != null)
                {
                    var mappings = await _context.PermisosRol
                        .Where(pr => pr.RolId == usuarioRol.Id && pr.PermisoId == gestionClientesPermiso.Id)
                        .ToListAsync();

                    if (mappings.Any())
                    {
                        _context.PermisosRol.RemoveRange(mappings);
                        _logger.LogInformation("Removidos {Count} mapeos de 'GestionClientes' para el rol Usuario.", mappings.Count);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo validar/remover el permiso 'GestionClientes' del rol Usuario.");
            }

            // Save all changes
            await _context.SaveChangesAsync();
            _logger.LogInformation("Initial data seeded successfully.");

            // Asegurar registros 'No aplica' (ID=1) para Talla y Color
            try
            {
                if (_context.Database.IsSqlServer())
                {
                    var tallaNoAplica = await _context.Tallas.AsNoTracking().FirstOrDefaultAsync(t => t.IdTalla == 1);
                    if (tallaNoAplica == null)
                    {
                        await _context.Database.ExecuteSqlRawAsync(
                            "SET IDENTITY_INSERT TALLA ON; INSERT INTO TALLA (IdTalla, Nombre, Abreviatura, Descripcion, Activo, FechaRegistro) VALUES (1, 'No aplica', NULL, 'Valor por defecto', 1, GETDATE()); SET IDENTITY_INSERT TALLA OFF;");
                        _logger.LogInformation("Se creó la talla 'No aplica' con ID=1");
                    }

                    // COLOR puede no existir en bases antiguas; intentar crear registro si la tabla existe
                    try
                    {
                        var colorNoAplica = await _context.Colores.AsNoTracking().FirstOrDefaultAsync(c => c.IdColor == 1);
                        if (colorNoAplica == null)
                        {
                            await _context.Database.ExecuteSqlRawAsync(
                                "SET IDENTITY_INSERT COLOR ON; INSERT INTO COLOR (IdColor, Nombre, Codigo, Descripcion, Activo, FechaRegistro) VALUES (1, 'No aplica', NULL, 'Valor por defecto', 1, GETDATE()); SET IDENTITY_INSERT COLOR OFF;");
                            _logger.LogInformation("Se creó el color 'No aplica' con ID=1");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "No fue posible asegurar el color 'No aplica'. Verifique migraciones de la tabla COLOR.");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo asegurar los registros 'No aplica' para talla y color.");
            }

            // Asegurar USUARIO administrador
            try
            {
                var adminRol = await _context.Roles.FirstOrDefaultAsync(r => r.NombreRol == "Administrador");
                if (adminRol != null)
                {
                    var adminExisting = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == "admin@petlove.com");
                    if (adminExisting == null)
                    {
                        var admin = new Usuario
                        {
                            Nombres = "Admin",
                            Apellidos = "PetLove",
                            Correo = "admin@petlove.com",
                            Clave = "admin123",
                            IdRol = adminRol.Id,
                            Activo = true,
                            FechaRegistro = DateTime.Now
                        };

                        await _context.Usuarios.AddAsync(admin);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Usuario administrador creado con credenciales por defecto (admin@petlove.com / admin123).");
                    }
                    else
                    {
                        // Asegurar datos quemados del admin: rol Administrador, activo y contraseña 'admin123'
                        adminExisting.IdRol = adminRol.Id;
                        adminExisting.Activo = true;
                        adminExisting.Clave = "admin123";
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Usuario administrador existente actualizado con rol y contraseña por defecto.");
                    }
                }
                else
                {
                    // Si por alguna razón falta, crearlo y reintentar
                    var newAdminRole = new Rol { NombreRol = "Administrador", Descripcion = "Acceso completo al sistema", Activo = true, FechaRegistro = DateTime.Now };
                    await _context.Roles.AddAsync(newAdminRole);
                    await _context.SaveChangesAsync();
                    _logger.LogWarning("Rol 'Administrador' no existía. Se creó y se intentará asignar al usuario admin.");

                    var adminExisting = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == "admin@petlove.com");
                    if (adminExisting == null)
                    {
                        var admin = new Usuario
                        {
                            Nombres = "Admin",
                            Apellidos = "PetLove",
                            Correo = "admin@petlove.com",
                            Clave = "admin123",
                            IdRol = newAdminRole.Id,
                            Activo = true,
                            FechaRegistro = DateTime.Now
                        };
                        await _context.Usuarios.AddAsync(admin);
                    }
                    else
                    {
                        adminExisting.IdRol = newAdminRole.Id;
                        adminExisting.Activo = true;
                        adminExisting.Clave = "admin123";
                    }
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo asegurar el usuario administrador por defecto.");
            }
        }
    }
}
