import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    ...DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

class ProductoVariantesService {
  async obtenerPrecioTalla(productoId, talla) {
    try {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTO_VARIANTES.OBTENER_PRECIO_TALLA.replace(':id', productoId).replace(':talla', encodeURIComponent(talla)));
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.precio === 'number') return data.precio;
      }
    } catch {}
    try {
      const raw = localStorage.getItem('preciosPorTalla') || '{}';
      const map = JSON.parse(raw);
      const key = `${productoId}:${talla}`;
      return map[key] || null;
    } catch {
      return null;
    }
  }

  async guardarPrecioTalla(productoId, talla, precio) {
    try {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTO_VARIANTES.GUARDAR_PRECIO_TALLA.replace(':id', productoId));
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ talla, precio })
      });
      if (response.ok) return true;
    } catch {}
    try {
      const raw = localStorage.getItem('preciosPorTalla') || '{}';
      const map = JSON.parse(raw);
      const key = `${productoId}:${talla}`;
      map[key] = Number(precio);
      localStorage.setItem('preciosPorTalla', JSON.stringify(map));
      return true;
    } catch {
      return false;
    }
  }
}

const productoVariantesService = new ProductoVariantesService();
export default productoVariantesService;