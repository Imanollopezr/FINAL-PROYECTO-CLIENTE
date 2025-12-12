import React, { useState, useEffect } from 'react';
import { MdAdd, MdRemove, MdDelete, MdShoppingCart, MdClose } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../features/auth/hooks/useAuth';
import carritoService from '../../services/carritoService';
import pedidosService from '../../services/pedidosService';
import productosService from '../../services/productosService';
import clientesService from '../../services/clientesService';
import './CarritoCompras.scss';

const CarritoCompras = ({ isOpen, onClose, carrito, setCarrito }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, permisos } = useAuth();
  const [loading, setLoading] = useState(false);

  

  useEffect(() => {
    // Sincronización con backend eliminada; solo estado local
  }, [isOpen]);

  // Eliminadas funciones de backend (cargarCarritoBackend, cargarProductos)



  const actualizarCantidad = async (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }

    const itemActual = carrito.find(i => i.id === productoId);
    const stockDisponible = Number(itemActual?.stock ?? 0);
    if (stockDisponible > 0 && nuevaCantidad > stockDisponible) {
      await Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `Solo hay ${stockDisponible} unidades disponibles de "${itemActual?.nombre || 'este producto'}".`,
      });
      return;
    }

    // Actualizar localmente primero
    setCarrito(carrito.map(item => 
      item.id === productoId 
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));

    // Sincronización con backend eliminada
  };

  const eliminarDelCarrito = async (productoId) => {
    // Actualizar localmente primero
    setCarrito(carrito.filter(item => item.id !== productoId));

    // Sincronización con backend eliminada
  };

  const vaciarCarrito = () => {
    Swal.fire({
      title: '¿Vaciar carrito?',
      text: 'Se eliminarán todos los productos del carrito',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, vaciar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Vaciar localmente
        setCarrito([]);
        
        Swal.fire({
          icon: 'success',
          title: 'Carrito vaciado',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const calcularSubtotal = (item) => {
    return item.cantidad * item.precioNumerico;
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + calcularSubtotal(item), 0);
  };

  const calcularIVA = () => {
    // IVA deshabilitado en el carrito (no mostrar ni aplicar)
    return 0;
  };

  const calcularTotalConIVA = () => {
    // Total sin IVA
    return calcularTotal();
  };

  const procederAlPago = async () => {
    try {
      // Validar autenticación
      const token = localStorage.getItem('authToken');
      if (!isAuthenticated || !token) {
        const result = await Swal.fire({
          icon: 'info',
          title: 'Inicia sesión para continuar',
          text: 'Necesitas iniciar sesión para procesar tu compra.',
          showCancelButton: true,
          confirmButtonText: 'Ir a Login',
          cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
          navigate('/login');
        }
        return;
      }

      // Bloquear flujo de compra para usuarios con rol Admin
      const esAdmin = (user?.role || user?.Rol || user?.nombreRol || '')
        .toString()
        .toLowerCase()
        .includes('admin');
      if (esAdmin) {
        await Swal.fire({
          icon: 'warning',
          title: 'Acceso restringido',
          text: 'Los administradores no pueden realizar compras desde la vista de clientes.',
        });
        return;
      }

      if (!carrito || carrito.length === 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Carrito vacío',
          text: 'Agrega productos antes de pagar.',
        });
        return;
      }

      setLoading(true);

      // Pre-validar productos contra el catálogo del backend
      let itemsValidos = [];
      let itemsInvalidos = [];
      try {
        const resultados = await Promise.all(
          carrito.map(async (item) => {
            try {
              const producto = await productosService.obtenerProductoPorId(item.id);
              if (!producto) {
                return { item, valido: false, motivo: 'no encontrado' };
              }
              const activo = (producto?.Activo ?? producto?.activo ?? true);
              const stock = (producto?.Stock ?? producto?.stock ?? 0);
              if (!activo) {
                return { item, valido: false, motivo: 'inactivo' };
              }
              if (stock < (item.cantidad || 1)) {
                return { item, valido: false, motivo: `stock insuficiente (${stock} disponible)` };
              }
              return { item, valido: true };
            } catch (e) {
              return { item, valido: false, motivo: 'no encontrado' };
            }
          })
        );
        itemsValidos = resultados.filter(r => r.valido).map(r => r.item);
        itemsInvalidos = resultados.filter(r => !r.valido);
      } catch (validError) {
        console.warn('Fallo en pre-validación de productos:', validError);
      }

      if (itemsInvalidos.length > 0) {
        const nombresInvalidos = itemsInvalidos.map(r => r.item?.nombre || `ID ${r.item?.id}`).join(', ');
        await Swal.fire({
          icon: 'warning',
          title: 'Productos no disponibles',
          text: `Se excluirán del pago: ${nombresInvalidos}`,
        });
      }

      if (!itemsValidos || itemsValidos.length === 0) {
        await Swal.fire({
          icon: 'error',
          title: 'Carrito sin productos válidos',
          text: 'Los productos seleccionados no están disponibles actualmente.',
        });
        setLoading(false);
        return;
      }

      // Asegurar existencia del carrito en backend y vaciar para evitar duplicados
      try {
        await carritoService.obtenerCarrito(token); // crea carrito si no existe
        await carritoService.vaciarCarrito(token);
        for (const item of itemsValidos) {
          // Enviar la cantidad actual del item
          await carritoService.agregarItem(token, item.id, item.cantidad);
        }
      } catch (syncError) {
        console.error('Error al sincronizar carrito con backend:', syncError);
        await Swal.fire({
          icon: 'error',
          title: 'Error al sincronizar',
          text: syncError.message || 'No se pudo sincronizar el carrito con el servidor.',
        });
        setLoading(false);
        return;
      }

      // Solicitar datos del comprador (checkout)
      const isAdminUser = (user?.role || user?.Rol || user?.nombreRol || '')
        .toString()
        .toLowerCase()
        .includes('admin');
      // Derivar nombre y apellidos correctamente cuando solo hay nombre completo
      const fullName = isAdminUser ? '' : (user?.name ?? user?.Nombre ?? '');
      let nombreDefault = isAdminUser ? '' : (user?.nombres ?? user?.nombre ?? '');
      let apellidoDefault = isAdminUser ? '' : (user?.apellidos ?? user?.apellido ?? user?.Apellidos ?? user?.lastName ?? '');
      if (!nombreDefault && !apellidoDefault && fullName) {
        const parts = String(fullName).trim().split(/\s+/);
        nombreDefault = parts[0] || '';
        apellidoDefault = parts.slice(1).join(' ') || '';
      }
      // Si el campo "nombres" trae nombre completo y apellidos está vacío, separarlo
      if (nombreDefault && !apellidoDefault) {
        const parts = String(nombreDefault).trim().split(/\s+/);
        if (parts.length > 1) {
          nombreDefault = parts[0];
          apellidoDefault = parts.slice(1).join(' ');
        }
      }
      // Prefiere datos del perfil de cliente si existen
      let me = null;
      try { me = await clientesService.obtenerMiCliente(); } catch {}
      const profileDoc = String(me?.Documento ?? me?.documento ?? user?.documento ?? user?.Documento ?? '').replace(/\D/g, '');
      const lockDoc = !!profileDoc;
      const docDefault = lockDoc ? profileDoc : '';
      let telDefault = isAdminUser ? '' : (me?.telefono ?? me?.Telefono ?? user?.telefono ?? user?.Telefono ?? '');
      let dirDefault = isAdminUser ? '' : (me?.direccion ?? me?.Direccion ?? user?.direccion ?? user?.Direccion ?? '');
      let ciudadDefault = isAdminUser ? '' : (me?.ciudad ?? me?.Ciudad ?? user?.ciudad ?? user?.Ciudad ?? '');
      if (me) {
        nombreDefault = me?.nombres ?? me?.nombre ?? nombreDefault;
        apellidoDefault = me?.apellidos ?? me?.apellido ?? me?.Apellido ?? me?.Apellidos ?? apellidoDefault;
      }
      if (nombreDefault && !apellidoDefault) {
        const parts = String(nombreDefault).trim().split(/\s+/);
        if (parts.length > 1) {
          nombreDefault = parts[0];
          apellidoDefault = parts.slice(1).join(' ');
        }
      }
      const formHtml = `
        <div class="checkout-form">
          <div class="form-row">
            <label>Documento</label>
            <input id="doc" type="tel" placeholder="Documento (máx. 10 dígitos)" value="${docDefault}" maxlength="10" inputmode="numeric" ${lockDoc ? 'readonly' : ''} />
          </div>
          <div class="form-row">
            <label>Nombre</label>
            <input id="nombre" type="text" placeholder="Nombre" value="${nombreDefault}" readonly />
          </div>
          <div class="form-row">
            <label>Apellidos</label>
            <input id="apellido" type="text" placeholder="Apellidos" value="${apellidoDefault}" readonly />
          </div>
          <div class="form-row">
            <label>Teléfono</label>
            <input id="tel" type="tel" placeholder="Celular (máx. 10 dígitos)" value="${telDefault}" maxlength="10" inputmode="numeric" />
          </div>
          <div class="form-row">
            <label>Dirección</label>
            <input id="dir" type="text" placeholder="Calle y número" value="${dirDefault}" />
          </div>
          <div class="form-row">
            <label>Ciudad</label>
            <input id="ciudad" type="text" placeholder="Ciudad" value="${ciudadDefault}" />
          </div>
        </div>`;

      const formResult = await Swal.fire({
        title: 'Datos de compra',
        html: formHtml,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Pagar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          const docInput = document.getElementById('doc');
          const telInput = document.getElementById('tel');
          const nombreInput = document.getElementById('nombre');
          const apellidoInput = document.getElementById('apellido');
          

          const enforceDigitsMax10 = (el) => {
            const v = (el?.value || '').replace(/\D/g, '').slice(0, 10);
            el.value = v;
          };
          const enforceLettersOnly = (el) => {
            const v = (el?.value || '').replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ\s]/g, '');
            el.value = v;
          };

          const lookupClientePorDocumento = async () => {
            const docNum = (docInput?.value || '').replace(/\D/g, '').slice(0, 10);
            if (!docNum) {
              return;
            }
            try {
              const resultados = await clientesService.buscar(docNum);
              const exact = Array.isArray(resultados)
                ? resultados.find(c => String(c.documento || c.Documento || '').replace(/\D/g, '') === docNum)
                : null;
              if (exact) {
                if (nombreInput) {
                  nombreInput.value = exact.nombres || exact.nombre || '';
                }
                if (apellidoInput) {
                  apellidoInput.value = exact.apellidos || exact.apellido || exact.lastName || '';
                }
              } else {
                // mantener nombre/apellido editables
              }
            } catch {
              // mantener nombre/apellido editables
            }
          };

          docInput?.addEventListener('input', () => {
            enforceDigitsMax10(docInput);
            // Consulta opcional para autocompletar nombre/apellido sin bloquear
            // lookupClientePorDocumento();
          });
          telInput?.addEventListener('input', () => {
            enforceDigitsMax10(telInput);
          });
          nombreInput?.addEventListener('input', () => {
            enforceLettersOnly(nombreInput);
          });
          apellidoInput?.addEventListener('input', () => {
            enforceLettersOnly(apellidoInput);
          });

        },
        preConfirm: () => {
          const doc = document.getElementById('doc')?.value?.trim();
          const nombre = document.getElementById('nombre')?.value?.trim();
          const apellido = document.getElementById('apellido')?.value?.trim();
          const tel = document.getElementById('tel')?.value?.trim();
          const dir = document.getElementById('dir')?.value?.trim();
          const ciudad = document.getElementById('ciudad')?.value?.trim();
          const docDigits = (doc || '').replace(/\D/g, '');
          const telDigits = (tel || '').replace(/\D/g, '');
          if (docDigits.length > 10) {
            Swal.showValidationMessage('El documento debe tener máximo 10 dígitos');
            return;
          }
          if (telDigits.length > 10) {
            Swal.showValidationMessage('El teléfono debe tener máximo 10 dígitos');
            return;
          }
          
          const nombreEl = document.getElementById('nombre');
          const apellidoEl = document.getElementById('apellido');
          const letrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
          if (nombreEl?.readOnly || apellidoEl?.readOnly) {
            return { doc: docDigits, nombre: nombreEl.value, apellido: apellidoEl.value, tel: telDigits, dir, ciudad };
          }
          if (!nombre) {
            Swal.showValidationMessage('El nombre es obligatorio');
            return;
          }
          if (nombre && !letrasRegex.test(nombre)) {
            Swal.showValidationMessage('El nombre solo puede contener letras y espacios');
            return;
          }
          if (apellido && !letrasRegex.test(apellido)) {
            Swal.showValidationMessage('El apellido solo puede contener letras y espacios');
            return;
          }
          return { doc: docDigits, nombre, apellido, tel: telDigits, dir, ciudad };
        }
      });

      if (!formResult.isConfirmed || !formResult.value) {
        setLoading(false);
        return;
      }

      const { doc, nombre, apellido, tel, dir, ciudad } = formResult.value;

      const datosCompra = {
        Nombres: nombre || null,
        Apellidos: apellido || null,
        Documento: doc || null,
        Telefono: tel || null,
        Direccion: dir || null,
        Ciudad: ciudad || null,
        Observaciones: `Compra desde carrito web${nombre ? ' - ' + nombre : ''}${apellido ? ' ' + apellido : ''}`
      };

      // Crear pedido oficial en backend (Pendiente)
      try {
        const pedidoCreado = await pedidosService.crearDesdeCarrito(carrito, datosCompra);
        const pedidoId = pedidoCreado?.id || pedidoCreado?.Id;
        await Swal.fire({
          icon: 'success',
          title: 'Pedido registrado',
          text: pedidoId ? `Tu pedido #${pedidoId} quedó en estado Pendiente.` : 'Tu pedido quedó en estado Pendiente.',
        });
        localStorage.setItem('ultimoDocumentoCompra', String(doc || '').replace(/\D/g, ''));
        if (typeof setCarrito === 'function') {
          setCarrito([]);
        }
        if (typeof onClose === 'function') {
          onClose();
        }
      } catch (pedErr) {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo crear el pedido',
          text: pedErr?.message || 'Intenta nuevamente más tarde.',
        });
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error en procederAlPago:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error inesperado',
        text: 'Ocurrió un problema inesperado. Intenta nuevamente.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="carrito-overlay">
      <div className="carrito-modal">
        <div className="carrito-header">
          <h2>
            <MdShoppingCart className="carrito-icon" />
            Carrito de Compras
          </h2>
          <button className="btn-cerrar" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className="carrito-contenido">
          {carrito.length === 0 ? (
            <div className="carrito-vacio">
              <MdShoppingCart className="carrito-vacio-icon" />
              <p>Tu carrito está vacío</p>
              <p className="carrito-vacio-subtitle">Agrega productos para comenzar</p>
            </div>
          ) : (
            <>
              <div className="carrito-productos">
                {carrito.map(item => {
                  return (
                    <div key={item.id} className="carrito-item">
                      <div className="item-imagen">
                        <img 
                          src={item.imagen || '/src/assets/images/Huella_Petlove.png'} 
                          alt={item.nombre}
                          onError={(e) => {
                            e.target.src = '/src/assets/images/Huella_Petlove.png';
                          }}
                        />
                      </div>
                      
                      <div className="item-info">
                        <h4>{item.nombre}</h4>
                        <p className="item-precio">${item.precioNumerico?.toLocaleString()}</p>
                      </div>

                      <div className="item-controles">
                        <div className="cantidad-controles">
                          <button 
                            className="btn-cantidad"
                            onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                            disabled={loading}
                          >
                            <MdRemove />
                          </button>
                          <span className="cantidad">{item.cantidad}</span>
                          <button 
                            className="btn-cantidad"
                            onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                            disabled={loading || (Number(item.stock ?? 0) > 0 && item.cantidad >= Number(item.stock ?? 0))}
                          >
                            <MdAdd />
                          </button>
                        </div>
                        
                        <div className="item-subtotal">
                          ${calcularSubtotal(item).toLocaleString()}
                        </div>
                        
                        <button 
                          className="btn-eliminar"
                          onClick={() => eliminarDelCarrito(item.id)}
                          disabled={loading}
                          title="Eliminar del carrito"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="carrito-resumen">
                <div className="resumen-linea">
                  <span>Subtotal:</span>
                  <span>${calcularTotal().toLocaleString()}</span>
                </div>
                <div className="resumen-linea total">
                  <span>Total:</span>
                  <span>${calcularTotalConIVA().toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="carrito-acciones">
          {carrito.length > 0 && (
            <>
              <button 
                className="btn-vaciar"
                onClick={vaciarCarrito}
                disabled={loading}
              >
                Vaciar Carrito
              </button>
              <button 
                className="btn-confirmar"
                onClick={procederAlPago}
                disabled={loading}
                title="Pagar"
              >
                Pagar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarritoCompras;
