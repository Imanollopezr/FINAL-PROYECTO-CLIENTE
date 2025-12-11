using Microsoft.EntityFrameworkCore;
using PetLove.Core.Models;

namespace PetLove.Infrastructure.Data
{
    public class PetLoveDbContext : DbContext
    {
        public PetLoveDbContext(DbContextOptions<PetLoveDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<Producto> Productos { get; set; }
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Proveedor> Proveedores { get; set; }
        public DbSet<ProductoProveedor> ProductoProveedores { get; set; }
        public DbSet<Venta> Ventas { get; set; }
        public DbSet<DetalleVenta> DetallesVenta { get; set; }
        public DbSet<Compra> Compras { get; set; }
        public DbSet<DetalleCompra> DetallesCompra { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<DetallePedido> DetallesPedido { get; set; }
        
        // Master Tables
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Marca> Marcas { get; set; }
        public DbSet<Medida> Medidas { get; set; }
        public DbSet<Talla> Tallas { get; set; }
        public DbSet<Color> Colores { get; set; }
        public DbSet<TipoDocumento> TipoDocumentos { get; set; }
        public DbSet<MetodoPago> MetodosPago { get; set; }
        public DbSet<Estado> Estados { get; set; }
        
        // User Management
        public DbSet<Rol> Roles { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<Permiso> Permisos { get; set; }
        public DbSet<PermisoRol> PermisosRol { get; set; }
        
        // Shopping Cart
        public DbSet<Carrito> Carritos { get; set; }
        public DbSet<CarritoItem> CarritoItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuración de Producto
            modelBuilder.Entity<Producto>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Precio).HasPrecision(18, 2);
                entity.HasIndex(e => e.Nombre);
                
                // Relaciones con tablas maestras
                entity.HasOne(e => e.Categoria)
                    .WithMany(c => c.Productos)
                    .HasForeignKey(e => e.IdCategoriaProducto)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(e => e.Marca)
                    .WithMany(m => m.Productos)
                    .HasForeignKey(e => e.IdMarcaProducto)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(e => e.Medida)
                    .WithMany(m => m.Productos)
                    .HasForeignKey(e => e.IdMedidaProducto)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Talla)
                    .WithMany()
                    .HasForeignKey(e => e.IdTalla)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Color)
                    .WithMany()
                    .HasForeignKey(e => e.IdColor)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de Cliente
            modelBuilder.Entity<Cliente>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.Documento);
                
                // Configurar la relación con TipoDocumento
                entity.HasOne(e => e.TipoDocumento)
                    .WithMany(t => t.Clientes)
                    .HasForeignKey(e => e.TipoDocumentoIdTipoDocumento)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configuración de Proveedor
            modelBuilder.Entity<Proveedor>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Proveedores");
                entity.HasIndex(e => e.Nombre);
                entity.HasIndex(e => e.Activo);
                
                // Configurar la relación con TipoDocumento
                entity.HasOne(e => e.TipoDocumento)
                    .WithMany(t => t.Proveedores)
                    .HasForeignKey(e => e.TipoDocumentoIdTipoDocumento)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configuración de Venta
            modelBuilder.Entity<Venta>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Subtotal).HasPrecision(18, 2);
                entity.Property(e => e.Impuestos).HasPrecision(18, 2);
                entity.Property(e => e.Total).HasPrecision(18, 2);
                
                entity.HasOne(e => e.Cliente)
                    .WithMany(c => c.Ventas)
                    .HasForeignKey(e => e.ClienteId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de DetalleVenta
            modelBuilder.Entity<DetalleVenta>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PrecioUnitario).HasPrecision(18, 2);
                entity.Property(e => e.Descuento).HasPrecision(18, 2);
                entity.Property(e => e.Subtotal).HasPrecision(18, 2);
                
                entity.HasOne(e => e.Venta)
                    .WithMany(v => v.DetallesVenta)
                    .HasForeignKey(e => e.VentaId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Producto)
                    .WithMany(p => p.DetallesVenta)
                    .HasForeignKey(e => e.ProductoId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de Compra
            modelBuilder.Entity<Compra>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Compras");
                
                entity.Property(e => e.FechaCompra)
                    .HasColumnType("datetime2");
                    
                entity.Property(e => e.Subtotal)
                    .HasPrecision(18, 2);
                    
                entity.Property(e => e.Impuestos)
                    .HasPrecision(18, 2);
                    
                entity.Property(e => e.Total)
                    .HasPrecision(18, 2);

                // Precisión para porcentaje de ganancia
                entity.Property(e => e.PorcentajeGanancia)
                    .HasPrecision(18, 2);
                    
                entity.Property(e => e.NumeroFactura)
                    .HasMaxLength(20);
                    
                entity.Property(e => e.Estado)
                    .HasMaxLength(20)
                    .IsRequired();
                    
                entity.Property(e => e.Observaciones)
                    .HasMaxLength(500);
                    
                entity.Property(e => e.FechaRecepcion)
                    .HasColumnType("datetime2");
                    
                entity.Property(e => e.FechaActualizacion)
                    .HasColumnType("datetime2");
                
                entity.HasOne(e => e.Proveedor)
                    .WithMany(p => p.Compras)
                    .HasForeignKey(e => e.ProveedorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de DetalleCompra
            modelBuilder.Entity<DetalleCompra>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("DetalleCompra");
                
                entity.Property(e => e.PrecioUnitario)
                    .HasPrecision(18, 2);
                    
                entity.Property(e => e.Subtotal)
                    .HasPrecision(18, 2);
                
                entity.HasOne(e => e.Compra)
                    .WithMany(c => c.DetallesCompra)
                    .HasForeignKey(e => e.CompraId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Producto)
                    .WithMany(p => p.DetallesCompra)
                    .HasForeignKey(e => e.ProductoId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de Pedido
            modelBuilder.Entity<Pedido>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Subtotal).HasPrecision(18, 2);
                entity.Property(e => e.CostoEnvio).HasPrecision(18, 2);
                entity.Property(e => e.Impuestos).HasPrecision(18, 2);
                entity.Property(e => e.Total).HasPrecision(18, 2);
                
                entity.HasOne(e => e.Cliente)
                    .WithMany(c => c.Pedidos)
                    .HasForeignKey(e => e.ClienteId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de DetallePedido
            modelBuilder.Entity<DetallePedido>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PrecioUnitario).HasPrecision(18, 2);
                entity.Property(e => e.Descuento).HasPrecision(18, 2);
                entity.Property(e => e.Subtotal).HasPrecision(18, 2);
                
                entity.HasOne(e => e.Pedido)
                    .WithMany(p => p.DetallesPedido)
                    .HasForeignKey(e => e.PedidoId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Producto)
                    .WithMany(p => p.DetallesPedido)
                    .HasForeignKey(e => e.ProductoId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de Categoria
            modelBuilder.Entity<Categoria>(entity =>
            {
                entity.ToTable("CATEGORIA_PRODUCTO");
                entity.HasKey(e => e.IdCategoriaProducto);
                entity.HasIndex(e => e.Nombre).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Descripcion).HasMaxLength(200);
            });

            // Configuración de Marca
            modelBuilder.Entity<Marca>(entity =>
            {
                entity.ToTable("MARCA");
                entity.HasKey(e => e.IdMarca);
                entity.HasIndex(e => e.Nombre).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Descripcion).HasMaxLength(200);
            });

            // Configuración de Medida
            modelBuilder.Entity<Medida>(entity =>
            {
                entity.ToTable("MEDIDA");
                entity.HasKey(e => e.IdMedida);
                entity.HasIndex(e => e.Nombre).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Abreviatura).IsRequired().HasMaxLength(10);
                entity.Property(e => e.Descripcion).HasMaxLength(200);
            });

            // Configuración de Talla
            modelBuilder.Entity<Talla>(entity =>
            {
                entity.ToTable("TALLA");
                entity.HasKey(e => e.IdTalla);
                entity.HasIndex(e => e.Nombre).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Abreviatura).HasMaxLength(10);
                entity.Property(e => e.Descripcion).HasMaxLength(200);
            });

            // Configuración de Color
            modelBuilder.Entity<Color>(entity =>
            {
                entity.ToTable("COLOR");
                entity.HasKey(e => e.IdColor);
                entity.HasIndex(e => e.Nombre).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Codigo).HasMaxLength(50);
                entity.Property(e => e.Descripcion).HasMaxLength(200);
            });

            // Configuración de TipoDocumento
            modelBuilder.Entity<TipoDocumento>(entity =>
            {
                entity.ToTable("TIPO_DOCUMENTO");
                entity.HasKey(e => e.IdTipoDocumento);
                entity.HasIndex(e => e.Nombre).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Descripcion).HasMaxLength(200);
            });

            // Configuración de MetodoPago
            modelBuilder.Entity<MetodoPago>(entity =>
            {
                entity.ToTable("METODO_PAGO");
                entity.HasKey(e => e.IdMetodoPago);
                entity.HasIndex(e => e.Nombre).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Descripcion).HasMaxLength(200);
            });

            // Configuración de Estado
            modelBuilder.Entity<Estado>(entity =>
            {
                entity.ToTable("ESTADO");
                entity.HasKey(e => e.IdEstado);
                entity.HasIndex(e => e.Nombre).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Descripcion).HasMaxLength(200);
            });

            // Configuración de Rol
            modelBuilder.Entity<Rol>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.NombreRol).IsUnique();
                entity.Property(e => e.NombreRol).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Descripcion).HasMaxLength(200);
            });

            // Configuración de Permiso
            modelBuilder.Entity<Permiso>(entity =>
            {
                entity.ToTable("PERMISO");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Nombre).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Descripcion).HasMaxLength(250);
            });

            // Configuración de PermisoRol (N-M)
            modelBuilder.Entity<PermisoRol>(entity =>
            {
                entity.ToTable("PERMISO_ROL");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.RolId, e.PermisoId }).IsUnique();

                entity.HasOne(e => e.Rol)
                    .WithMany(r => r.PermisosRol)
                    .HasForeignKey(e => e.RolId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Permiso)
                    .WithMany(p => p.PermisosRol)
                    .HasForeignKey(e => e.PermisoId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configuración de Usuario
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Correo).IsUnique();
                entity.Property(e => e.Nombres).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Apellidos).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Correo).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Clave).IsRequired().HasMaxLength(255);
                
                entity.HasOne(e => e.Rol)
                    .WithMany(r => r.Usuarios)
                    .HasForeignKey(e => e.IdRol)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de RefreshToken
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Token).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Token).IsUnique();
                entity.Property(e => e.RazonRevocacion).HasMaxLength(500);
                entity.Property(e => e.ReemplazadoPor).HasMaxLength(255);
                entity.Property(e => e.DireccionIP).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                
                entity.HasOne(e => e.Usuario)
                    .WithMany()
                    .HasForeignKey(e => e.UsuarioId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configuración de PasswordResetToken
            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Codigo).IsRequired().HasMaxLength(6);
                entity.HasIndex(e => e.Codigo).IsUnique();
                entity.Property(e => e.DireccionIP).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                
                // Mapeo de columnas para resolver discrepancias entre modelo y base de datos
                entity.Property(e => e.FechaCreacion).HasColumnName("CreatedAt");
                entity.Property(e => e.FechaExpiracion).HasColumnName("ExpiresAt");
                entity.Property(e => e.Usado).HasColumnName("IsUsed");
                entity.Property(e => e.UsuarioId).HasColumnName("UserId");
                
                entity.HasOne(e => e.Usuario)
                    .WithMany()
                    .HasForeignKey(e => e.UsuarioId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configuración de ProductoProveedor
            modelBuilder.Entity<ProductoProveedor>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PrecioCompra).HasPrecision(18, 2);
                entity.HasIndex(e => new { e.ProductoId, e.ProveedorId }).IsUnique();
                
                entity.HasOne(e => e.Producto)
                    .WithMany(p => p.ProductoProveedores)
                    .HasForeignKey(e => e.ProductoId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Proveedor)
                    .WithMany(p => p.ProductoProveedores)
                    .HasForeignKey(e => e.ProveedorId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configuración de Carrito
            modelBuilder.Entity<Carrito>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UsuarioId);
                
                entity.HasOne(e => e.Usuario)
                    .WithMany()
                    .HasForeignKey(e => e.UsuarioId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configuración de CarritoItem
            modelBuilder.Entity<CarritoItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PrecioUnitario).HasPrecision(18, 2);
                
                entity.HasOne(e => e.Carrito)
                    .WithMany(c => c.Items)
                    .HasForeignKey(e => e.CarritoId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Producto)
                    .WithMany()
                    .HasForeignKey(e => e.ProductoId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
