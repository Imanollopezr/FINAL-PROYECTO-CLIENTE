import { jest, describe, test, expect } from '@jest/globals'

await jest.unstable_mockModule('../../../src/constants/apiConstants.js', () => ({
  DEFAULT_HEADERS: { 'Content-Type': 'application/json' },
  API_ENDPOINTS: {
    PRODUCTOS: {
      GET_ALL: '/api/productos',
      POR_CATEGORIA: '/api/productos/categoria/:categoria'
    },
    CATEGORIAS: {
      GET_ALL: '/api/categorias'
    }
  },
  buildApiUrl: (p) => `http://localhost:8091${p}`
}))

const categoriasService = (await import('../../../src/services/categoriasService.js')).default

describe('CategoriasService', () => {
  const makeResponse = (ok, data) => ({ ok, json: async () => data, status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Bad' })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  test('obtenerCategorias usa endpoint dedicado', async () => {
    const payload = [{ id: 1, nombre: 'alimento' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await categoriasService.obtenerCategorias()
    expect(res).toEqual(payload)
  })

  test('obtenerProductosPorCategoria retorna lista', async () => {
    const productos = [{ id: 10, nombre: 'Comida', categoria: 'alimento' }]
    global.fetch.mockResolvedValue(makeResponse(true, productos))
    const res = await categoriasService.obtenerProductosPorCategoria('alimento')
    expect(res).toEqual(productos)
  })

  test('buscarEnCategoria filtra por término', async () => {
    jest.spyOn(categoriasService, 'obtenerProductosPorCategoria').mockResolvedValue([
      { id: 1, nombre: 'Collar Azul', descripcion: 'Para perro' },
      { id: 2, nombre: 'Correa Roja', descripcion: 'Para perro' }
    ])
    const res = await categoriasService.buscarEnCategoria('accesorio', 'Collar')
    expect(res.map(p => p.nombre)).toEqual(['Collar Azul'])
  })

  test('obtenerTodosLosProductos retorna lista', async () => {
    const payload = [{ id: 5, nombre: 'Arena' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await categoriasService.obtenerTodosLosProductos()
    expect(res).toEqual(payload)
  })

  test('obtenerProductosPorCategoria usa URL correcta', async () => {
    const productos = [{ id: 10 }]
    global.fetch.mockResolvedValue(makeResponse(true, productos))
    await categoriasService.obtenerProductosPorCategoria('alimento')
    const [url] = global.fetch.mock.calls[0]
    expect(url).toBe('http://localhost:8091/api/productos/categoria/alimento')
  })
})
