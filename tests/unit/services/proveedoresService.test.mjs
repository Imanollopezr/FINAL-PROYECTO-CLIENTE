import { jest, describe, test, expect } from '@jest/globals'
jest.mock('../../../src/constants/apiConstants', () => ({
  API_BASE_URL: 'http://localhost:8091',
  API_ENDPOINTS: {
    PROVEEDORES: { GET_ALL: '/api/proveedores' }
  }
}))

import proveedoresService from '../../../src/services/proveedoresService.js'

describe('ProveedoresService', () => {
  const makeResponse = (ok, data) => ({ ok, status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Bad', json: async () => data })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  test('obtenerProveedores retorna lista', async () => {
    const payload = [{ id: 1, nombre: 'Proveedor X' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await proveedoresService.obtenerProveedores()
    expect(res).toEqual(payload)
  })

  test('obtenerProveedores usa URL correcta', async () => {
    global.fetch.mockResolvedValue(makeResponse(true, []))
    await proveedoresService.obtenerProveedores()
    const [url] = global.fetch.mock.calls[0]
    expect(url).toBe('http://localhost:8091/api/proveedores')
  })

  test('obtenerProveedores lanza error cuando no ok', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Bad', json: async () => ({}) })
    await expect(proveedoresService.obtenerProveedores()).rejects.toBeInstanceOf(Error)
  })

  test('obtenerTiposDocumento retorna lista del backend', async () => {
    const payload = [{ id: 1, nombre: 'Cédula de Ciudadanía' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await proveedoresService.obtenerTiposDocumento()
    expect(res).toEqual(payload)
  })

  test('obtenerTiposDocumento retorna fallback por defecto cuando no ok', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Bad', json: async () => ({}) })
    const res = await proveedoresService.obtenerTiposDocumento()
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(4)
    expect(res[0].nombre).toBeDefined()
  })
})
