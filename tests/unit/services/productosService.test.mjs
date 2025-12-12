import { jest, describe, test, expect } from '@jest/globals'
jest.mock('../../../src/constants/apiConstants', () => ({
  DEFAULT_HEADERS: { 'Content-Type': 'application/json' },
  API_ENDPOINTS: {
    PRODUCTOS: {
      GET_ALL: '/api/productos',
      CREATE: '/api/productos',
      UPDATE: '/api/productos/:id',
      DELETE: '/api/productos/:id',
      GET_BY_ID: '/api/productos/:id',
      BUSCAR: '/api/productos/buscar/:termino',
      POR_CATEGORIA: '/api/productos/categoria/:categoria'
    }
  },
  buildApiUrl: (p) => `http://localhost:8091${p}`
}))

import productosService from '../../../src/services/productosService.js'

describe('ProductosService', () => {
  const makeResponse = (ok, data) => ({ ok, status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Bad', json: async () => data, text: async () => JSON.stringify(data) })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  test('obtenerProductos retorna lista', async () => {
    const payload = [{ id: 1, nombre: 'Alimento' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await productosService.obtenerProductos()
    expect(res).toEqual(payload)
  })

  test('crearProducto realiza POST y retorna creado', async () => {
    const nuevo = { nombre: 'Juguete' }
    const created = { id: 2, ...nuevo }
    global.fetch.mockResolvedValue(makeResponse(true, created))
    const res = await productosService.crearProducto(nuevo)
    expect(res).toEqual(created)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
  })

  test('buscarProductos retorna lista', async () => {
    const payload = [{ id: 5, nombre: 'Correa' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await productosService.buscarProductos('correa')
    expect(res).toEqual(payload)
  })

  test('obtenerProductoPorId retorna producto', async () => {
    const producto = { id: 7, nombre: 'Cama' }
    global.fetch.mockResolvedValue(makeResponse(true, producto))
    const res = await productosService.obtenerProductoPorId(7)
    expect(res).toEqual(producto)
  })

  test('eliminarProducto realiza DELETE y retorna true', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, statusText: 'OK', json: async () => ({}) })
    const ok = await productosService.eliminarProducto(9)
    expect(ok).toBe(true)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('DELETE')
  })
})
