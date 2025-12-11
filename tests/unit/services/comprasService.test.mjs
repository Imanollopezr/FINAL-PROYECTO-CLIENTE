import { jest, describe, test, expect, beforeEach } from '@jest/globals'

await jest.unstable_mockModule('../../../src/constants/apiConstants.js', () => ({
  API_BASE_URL: 'http://localhost:8091',
  API_ENDPOINTS: {
    COMPRAS: {
      GET_ALL: '/api/compras',
      GET_BY_ID: '/api/compras/:id',
      CREATE: '/api/compras',
      UPDATE: '/api/compras/:id',
      DELETE: '/api/compras/:id',
      POR_PROVEEDOR: '/api/compras/proveedor/:proveedorId',
      POR_FECHA: '/api/compras/fecha/:fecha'
    }
  }
}))

const comprasService = (await import('../../../src/services/comprasService.js')).default

describe('ComprasService', () => {
  const makeResponse = (ok, data, status = 200) => ({ ok, status, statusText: ok ? 'OK' : 'Bad', json: async () => data, text: async () => JSON.stringify(data) })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  test('obtenerCompras retorna lista', async () => {
    const payload = [{ id: 1, numeroFactura: 'A-1' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await comprasService.obtenerCompras()
    expect(res).toEqual(payload)
  })

  test('crearCompra realiza POST y retorna creado', async () => {
    const compra = { proveedorId: 3 }
    const created = { id: 2, ...compra }
    global.fetch.mockResolvedValue(makeResponse(true, created))
    const res = await comprasService.crearCompra(compra)
    expect(res).toEqual(created)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
  })

  test('obtenerComprasPorFecha retorna lista', async () => {
    const list = [{ id: 9 }]
    global.fetch.mockResolvedValue(makeResponse(true, list))
    const res = await comprasService.obtenerComprasPorFecha(new Date('2025-01-01'))
    expect(res).toEqual(list)
  })

  test('actualizarCompra retorna true cuando status 204', async () => {
    global.fetch.mockResolvedValue(makeResponse(true, {}, 204))
    const ok = await comprasService.actualizarCompra(5, { estado: 'Procesada' })
    expect(ok).toBe(true)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('PUT')
  })

  test('eliminarCompra retorna true cuando status 204', async () => {
    global.fetch.mockResolvedValue(makeResponse(true, {}, 204))
    const ok = await comprasService.eliminarCompra(8)
    expect(ok).toBe(true)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('DELETE')
  })
})
