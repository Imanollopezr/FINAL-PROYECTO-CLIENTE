import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../features/auth/hooks/useAuth';
import authService from '../../services/authService';
import avatarService from '../../services/avatarService';
import usuariosService from '../../services/usuariosService';
import { API_ENDPOINTS, buildApiUrl } from '../../constants/apiConstants';
import { getToken as getStoreToken } from '../../features/auth/tokenStore';
import { MdVisibility, MdVisibilityOff, MdLock, MdPerson, MdMail } from 'react-icons/md';
import './MiCuenta.scss';
import clientesService from '../../services/clientesService';

const MiCuenta = () => {
  const { user, updateUser } = useAuth();
  const [perfil, setPerfil] = useState({ nombre: '', correo: '', imagen: '' });
  const [loading, setLoading] = useState(true);
  const [claveActual, setClaveActual] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [misPedidos, setMisPedidos] = useState([]);
  const [pedidosLoading, setPedidosLoading] = useState(true);
  

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const strength = useMemo(() => {
    const val = nuevaClave || '';
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score; // 0-5
  }, [nuevaClave]);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        // Intentar obtener perfil del backend si hay token
        const token = getStoreToken();
        const headers = token
          ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          : { 'Content-Type': 'application/json' };
        const resp = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.PROFILE), { headers, credentials: 'include' });
          const data = await resp.json();
          if (resp.ok && data?.data) {
            const p = data.data;
            setPerfil({ nombre: p.nombre || p.Nombre || '', correo: p.correo || p.Correo || '', imagen: p.imagenUrl || p.ImagenUrl || p.imagen || p.Imagen || '' });
          }
        
      } catch (e) {
        console.error('Error cargando perfil:', e);
      } finally {
        setLoading(false);
      }
    };
    cargarPerfil();
  }, []);

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        const lista = await clientesService.obtenerMisPedidos();
        if (Array.isArray(lista)) {
          setMisPedidos(lista);
        } else {
          setMisPedidos([]);
        }
      } catch {
        try {
          const raw = localStorage.getItem('pedidosLocal') || '[]';
          const parsed = JSON.parse(raw);
          setMisPedidos(Array.isArray(parsed) ? parsed : []);
        } catch {
          setMisPedidos([]);
        }
      } finally {
        setPedidosLoading(false);
      }
    };
    cargarPedidos();
  }, []);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Swal.fire('Archivo inválido', 'Selecciona una imagen (JPG, PNG, WEBP)', 'warning');
      return;
    }
    try {
      const subida = await avatarService.subirAvatar(file);
      const url = subida?.url;
      if (!url) throw new Error('No se recibió URL del servidor');
      // Previsualizar inmediatamente sin bloquear por la sincronización backend
      setPerfil((prev) => ({ ...prev, imagen: url }));

      try {
        await usuariosService.actualizarMiImagen(url);
        updateUser({ image: url });
        Swal.fire('Foto actualizada', 'Tu avatar se ha guardado en el servidor', 'success');
      } catch (syncErr) {
        console.error('Error sincronizando imagen en servidor:', syncErr);
        Swal.fire('Advertencia', syncErr.message || 'Se mostró la imagen, pero hubo un problema al guardarla en tu cuenta. Intenta de nuevo.', 'warning');
      }
    } catch (err) {
      console.error('Error subiendo/actualizando avatar:', err);
      Swal.fire('Error', err.message || 'No se pudo actualizar tu foto de perfil', 'error');
    }
  };

  const handleGuardarAvatar = async () => {
    if (!perfil.imagen) return;
    try {
      await usuariosService.actualizarMiImagen(perfil.imagen);
      updateUser({ image: perfil.imagen });
      Swal.fire('Foto guardada', 'Tu foto de perfil se ha sincronizado', 'success');
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo guardar tu foto de perfil', 'error');
    }
  };

  const handleQuitarAvatar = () => {
    setPerfil((prev) => ({ ...prev, imagen: '' }));
    updateUser({ image: '' });
  };

  const handleCambiarClave = async (e) => {
    e.preventDefault();
    if (!nuevaClave || nuevaClave.length < 8) {
      Swal.fire('Error', 'La nueva contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    if (nuevaClave !== confirmarClave) {
      Swal.fire('Error', 'La nueva contraseña y la confirmación no coinciden', 'error');
      return;
    }
    try {
      const res = await authService.changePassword(claveActual, nuevaClave, confirmarClave);
      Swal.fire('Éxito', res.mensaje || res.Mensaje || 'Contraseña actualizada correctamente', 'success');
      setClaveActual('');
      setNuevaClave('');
      setConfirmarClave('');
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo cambiar la contraseña', 'error');
    }
  };

  if (loading) return <div className="mi-cuenta-page"><div className="skeleton-card" /></div>;

  return (
    <div className="mi-cuenta-page">
      <div className="page-header">
        <a href="/productos-tienda" className="btn btn-primary header-shop" title="Ir a la tienda">
          🛍️ Ir a la Tienda
        </a>
        <span className="role-badge">{user?.role || 'Usuario'}</span>
      </div>

      <h2 className="page-title">Mi Cuenta</h2>

      <div className="content-grid">
        {/* Tarjeta de Perfil */}
        <div className="card profile-card">
          <div className="card-title">Perfil</div>
          <div className="profile-body">
            <div className="avatar-wrap">
              {perfil.imagen ? (
                <img src={perfil.imagen} alt="" className="avatar" />
              ) : (
                <div className="avatar placeholder" />
              )}
              <div className="avatar-actions">
                <label className="file-input">
                  <input type="file" accept="image/*" onChange={handleAvatarFileChange} />
                  <span>Elegir imagen</span>
                </label>
                <div className="button-group">
                  <button type="button" className="btn btn-secondary" onClick={handleGuardarAvatar} disabled={!perfil.imagen}>Guardar</button>
                  <button type="button" className="btn btn-tertiary" onClick={handleQuitarAvatar} disabled={!perfil.imagen}>Quitar</button>
                </div>
                <small className="hint">JPG, PNG, WEBP. Se guarda en el servidor y permanece aunque cierres o cambies de cuenta.</small>
              </div>
            </div>
            <div className="info-wrap">
              <div className="info-row">
                <MdPerson size={18} />
                <span className="label">Nombre</span>
                <span className="value">{perfil.nombre || user?.name || user?.nombre}</span>
              </div>
              <div className="info-row">
                <MdMail size={18} />
                <span className="label">Correo</span>
                <span className="value">{perfil.correo || user?.email || user?.correo}</span>
              </div>
              <div className="info-row">
                <MdLock size={18} />
                <span className="label">Estado</span>
                <span className="pill pill-success">Activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta de Cambio de contraseña */}
        <div className="card password-card">
          <div className="card-title">Cambiar contraseña</div>
          <form onSubmit={handleCambiarClave}>
            <div className="form-group">
              <label>Contraseña actual</label>
              <div className="input-wrap">
                <input
                  type={showActual ? 'text' : 'password'}
                  value={claveActual}
                  onChange={(e) => setClaveActual(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                />
                <button type="button" className="toggle-btn" onClick={() => setShowActual((v) => !v)} aria-label="Mostrar/ocultar contraseña actual">
                  {showActual ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Nueva contraseña</label>
              <div className="input-wrap">
                <input
                  type={showNueva ? 'text' : 'password'}
                  value={nuevaClave}
                  onChange={(e) => setNuevaClave(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                />
                <button type="button" className="toggle-btn" onClick={() => setShowNueva((v) => !v)} aria-label="Mostrar/ocultar nueva contraseña">
                  {showNueva ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
              <div className={`strength-meter s-${strength}`}>
                <div className="bars">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className="strength-label">
                  {strength <= 1 && 'Muy débil'}
                  {strength === 2 && 'Débil'}
                  {strength === 3 && 'Media'}
                  {strength === 4 && 'Fuerte'}
                  {strength >= 5 && 'Muy fuerte'}
                </span>
              </div>
              <small className="hint">Usa 8+ caracteres, incluye mayúsculas, números y símbolos.</small>
            </div>

            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <div className="input-wrap">
                <input
                  type={showConfirmar ? 'text' : 'password'}
                  value={confirmarClave}
                  onChange={(e) => setConfirmarClave(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                />
                <button type="button" className="toggle-btn" onClick={() => setShowConfirmar((v) => !v)} aria-label="Mostrar/ocultar confirmación">
                  {showConfirmar ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <div className="actions">
              <button type="submit" className="btn btn-primary">Actualizar contraseña</button>
            </div>
          </form>
        </div>

        
        <div className="card">
          <div className="card-title">Mis pedidos</div>
          <div className="card-body">
            {pedidosLoading ? (
              <div className="skeleton-list">
                <div className="skeleton-item" />
                <div className="skeleton-item" />
                <div className="skeleton-item" />
              </div>
            ) : misPedidos.length === 0 ? (
              <div className="empty-state">
                <span>No tienes pedidos registrados aún.</span>
              </div>
            ) : (
              <div className="orders-list">
                {misPedidos.slice(0, 10).map((p) => {
                  const id = p.id || p.Id;
                  const total = p.total || p.Total || 0;
                  const estado = p.estado || p.Estado || 'Pendiente';
                  const fecha = p.fechaCreacion || p.fechaPedido || p.FechaPedido || p.FechaCreacion;
                  const items = p.items || p.detallesPedido || [];
                  return (
                    <div key={id || JSON.stringify(p)} className="order-item">
                      <div className="order-main">
                        <span className="order-id">#{id ?? '—'}</span>
                        <span className={`order-status s-${String(estado).toLowerCase()}`}>{estado}</span>
                      </div>
                      <div className="order-meta">
                        <span className="order-date">{fecha ? new Date(fecha).toLocaleString() : 'Sin fecha'}</span>
                        <span className="order-total">${Number(total).toLocaleString()}</span>
                        <span className="order-count">{Array.isArray(items) ? items.length : 0} ítems</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MiCuenta;
