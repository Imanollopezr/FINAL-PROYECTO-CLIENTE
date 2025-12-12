import { jest, describe, test, expect, beforeEach } from '@jest/globals'

await jest.unstable_mockModule('../../../src/constants/apiConstants.js', () => ({
  API_BASE_URL: 'http://localhost:8091',
  API_ENDPOINTS: {
    VENTAS: { GET_ALL: '/api/ventas' }
  }
}))

const ventasService = (await import('../../../src/services/ventasService.js')).default

describe('VentasService', () => {
  const makeResponse = (ok, data, status = 200) => ({ ok, status, statusText: ok ? 'OK' : 'Bad', json: async () => data, text: async () => JSON.stringify(data) })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  test('obtenerVentas retorna lista', async () => {
    const payload = [{ id: 1 }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await ventasService.obtenerVentas()
    expect(res).toEqual(payload)
  })

  test('crearVenta realiza POST y retorna creado', async () => {
    const venta = { clienteId: 5 }
    const created = { id: 2, ...venta }
    global.fetch.mockResolvedValue(makeResponse(true, created))
    const res = await ventasService.crearVenta(venta)
    expect(res).toEqual(created)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
  })

  test('anularVenta realiza POST y retorna json', async () => {
    const payload = { ok: true }
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await ventasService.anularVenta(9)
    expect(res).toEqual(payload)
  })

  test('obtenerVentaPorId retorna detalle', async () => {
    const venta = { id: 7, total: 100 }
    global.fetch.mockResolvedValue(makeResponse(true, venta))
    const res = await ventasService.obtenerVentaPorId(7)
    expect(res).toEqual(venta)
  })

  test('actualizarVenta retorna true cuando status 204', async () => {
    global.fetch.mockResolvedValue(makeResponse(true, {}, 204))
    const ok = await ventasService.actualizarVenta(3, { total: 50 })
    expect(ok).toBe(true)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('PUT')
  })
})
