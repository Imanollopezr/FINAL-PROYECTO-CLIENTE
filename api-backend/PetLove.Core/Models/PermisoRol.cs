namespace PetLove.Core.Models
{
    public class PermisoRol
    {
        public int Id { get; set; }

        // FK a Rol
        public int RolId { get; set; }
        public Rol Rol { get; set; }

        // FK a Permiso
        public int PermisoId { get; set; }
        public Permiso Permiso { get; set; }
    }
}