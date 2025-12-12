import { jest, describe, test, expect } from '@jest/globals'
jest.mock('../../../src/constants/apiConstants', () => ({
  DEFAULT_HEADERS: { 'Content-Type': 'application/json' },
  API_ENDPOINTS: {
    PRODUCTO_VARIANTES: {
      OBTENER_PRECIO_TALLA: '/api/productos/:id/variantes/talla/:talla',
      GUARDAR_PRECIO_TALLA: '/api/productos/:id/variantes/talla'
    }
  },
  buildApiUrl: (p) => `http://localhost:8091${p}`
}))

import productoVariantesService from '../../../src/services/productoVariantesService.js'

describe('ProductoVariantesService', () => {
  const makeResponse = (ok, data, status = 200) => ({
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad',
    json: async () => data
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
    localStorage.clear()
  })

  test('obtenerPrecioTalla retorna precio desde API', async () => {
    global.fetch.mockResolvedValue(makeResponse(true, { precio: 12.34 }))
    const precio = await productoVariantesService.obtenerPrecioTalla(1, 'M')
    expect(precio).toBe(12.34)
  })

  test('obtenerPrecioTalla usa fallback localStorage', async () => {
    global.fetch.mockRejectedValue(new Error('network'))
    localStorage.setItem('preciosPorTalla', JSON.stringify({ '2:M': 20 }))
    const precio = await productoVariantesService.obtenerPrecioTalla(2, 'M')
    expect(precio).toBe(20)
  })

  test('guardarPrecioTalla guarda en localStorage cuando API falla', async () => {
    global.fetch.mockRejectedValue(new Error('network'))
    const ok = await productoVariantesService.guardarPrecioTalla(4, 'S', 15)
    expect(ok).toBe(true)
    const map = JSON.parse(localStorage.getItem('preciosPorTalla'))
    expect(map['4:S']).toBe(15)
  })

  test('guardarPrecioTalla realiza POST y retorna true', async () => {
    global.fetch.mockResolvedValue(makeResponse(true, {}))
    const ok = await productoVariantesService.guardarPrecioTalla(5, 'L', 22)
    expect(ok).toBe(true)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(typeof opts.body).toBe('string')
  })

  test('obtenerPrecioTalla retorna null cuando sin datos', async () => {
    global.fetch.mockResolvedValue(makeResponse(true, {}))
    const precio = await productoVariantesService.obtenerPrecioTalla(9, 'XL')
    expect(precio).toBe(null)
  })
})
