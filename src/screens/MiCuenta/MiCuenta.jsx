import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../features/auth/hooks/useAuth';
import authService from '../../services/authService';
import avatarService from '../../services/avatarService';
import usuariosService from '../../services/usuariosService';
import { API_ENDPOINTS, buildApiUrl } from '../../constants/apiConstants';
import { getToken as getStoreToken } from '../../features/auth/tokenStore';
import { MdVisibility, MdVisibilityOff, MdLock, MdPerson, MdMail } from 'react-icons/md';
import clientesService from '../../services/clientesService';
import './MiCuenta.scss';

const MiCuenta = () => {
  const { user, updateUser } = useAuth();
  const [perfil, setPerfil] = useState({ nombre: '', correo: '', imagen: '' });
  const [loading, setLoading] = useState(true);
  const [claveActual, setClaveActual] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [clienteForm, setClienteForm] = useState({ nombre: '', apellido: '', telefono: '', direccion: '', ciudad: '', documento: '', codigoPostal: '' });
  

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
        try {
          const me = await clientesService.obtenerMiCliente();
          setClienteForm({
            nombre: me?.nombre || '',
            apellido: me?.apellido || '',
            telefono: me?.telefono || '',
            direccion: me?.direccion || '',
            ciudad: me?.ciudad || '',
            documento: me?.documento || '',
            codigoPostal: me?.codigoPostal || ''
          });
        } catch (err) {
          console.error('Error obteniendo cliente:', err);
        }
        
      } catch (e) {
        console.error('Error cargando perfil:', e);
      } finally {
        setLoading(false);
      }
    };
    cargarPerfil();
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

  const handleGuardarCliente = async () => {
    try {
      const payload = {
        Nombre: clienteForm.nombre,
        Apellido: clienteForm.apellido,
        Telefono: clienteForm.telefono,
        Direccion: clienteForm.direccion,
        Ciudad: clienteForm.ciudad,
        Documento: clienteForm.documento,
        CodigoPostal: clienteForm.codigoPostal
      };
      await clientesService.actualizarMiCliente(payload);
      Swal.fire('Perfil actualizado', 'Tus datos se han guardado correctamente', 'success');
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudieron guardar tus datos', 'error');
    }
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

  const verificarToken = async () => {
    try {
      const token = getStoreToken();
      if (!token) {
        Swal.fire('Token no encontrado', 'No hay token almacenado. Inicia sesión nuevamente.', 'warning');
        return;
      }

      let payload = {};
      try {
        const base64 = token.split('.')[1];
        const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(normalized);
        payload = JSON.parse(json || '{}');
      } catch {}

      const exp = payload?.exp ? new Date(payload.exp * 1000) : null;
      const rol = payload?.NombreRol || payload?.role || 'Desconocido';

      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const resp = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.PROFILE), { method: 'GET', headers, credentials: 'include' });
      const ok = resp.ok;
      const text = await resp.text();

      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

      const mensaje = ok ? 'Token válido y perfil accesible' : (data?.mensaje || data?.Mensaje || 'Token inválido o expirado');

      const detalles = [
        exp ? `Expira: ${exp.toLocaleString()}` : 'Expira: desconocido',
        `Rol: ${rol}`,
        `Estado HTTP: ${resp.status}`
      ].join('\n');

      Swal.fire(ok ? 'Verificación exitosa' : 'Verificación fallida', `${mensaje}\n\n${detalles}`, ok ? 'success' : 'error');
    } catch (err) {
      Swal.fire('Error verificando token', err.message || 'Ocurrió un problema al verificar el token', 'error');
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

        <div className="card profile-card">
          <div className="card-title">Datos del Cliente</div>
          <div className="cliente-body">
            <div className="formulario-dos-columnas-base">
              <div className="form-group">
                <label>Nombre</label>
                <input value={clienteForm.nombre} onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })} placeholder="Tu nombre" />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input value={clienteForm.apellido} onChange={(e) => setClienteForm({ ...clienteForm, apellido: e.target.value })} placeholder="Tu apellido" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input value={clienteForm.telefono} onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })} placeholder="Teléfono de contacto" />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input value={clienteForm.direccion} onChange={(e) => setClienteForm({ ...clienteForm, direccion: e.target.value })} placeholder="Dirección" />
              </div>
              <div className="form-group">
                <label>Ciudad</label>
                <input value={clienteForm.ciudad} onChange={(e) => setClienteForm({ ...clienteForm, ciudad: e.target.value })} placeholder="Ciudad" />
              </div>
              <div className="form-group">
                <label>Documento</label>
                <input value={clienteForm.documento} onChange={(e) => setClienteForm({ ...clienteForm, documento: e.target.value })} placeholder="Documento" />
              </div>
              <div className="form-group">
                <label>Código Postal</label>
                <input value={clienteForm.codigoPostal} onChange={(e) => setClienteForm({ ...clienteForm, codigoPostal: e.target.value })} placeholder="Código Postal" />
              </div>
            </div>
            <div className="actions" style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary" onClick={handleGuardarCliente}>Guardar datos</button>
              <button type="button" className="btn btn-secondary" onClick={verificarToken}>Verificar token</button>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default MiCuenta;
