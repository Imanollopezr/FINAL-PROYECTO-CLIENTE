import { jest, describe, test, expect } from '@jest/globals'
jest.mock('../../../src/constants/apiConstants', () => ({
  DEFAULT_HEADERS: { 'Content-Type': 'application/json' },
  API_ENDPOINTS: {
    AUTH: { REFRESH_TOKEN: '/api/auth/refresh-token' },
    MEDIDAS: {
      GET_ALL: '/api/medidas',
      CREATE: '/api/medidas',
      UPDATE: '/api/medidas/:id',
      CAMBIAR_ESTADO: '/api/medidas/:id/estado',
      DELETE: '/api/medidas/:id'
    }
  },
  buildApiUrl: (p) => `http://localhost:8091${p}`
}))

jest.mock('../../../src/features/auth/tokenStore', () => ({
  getToken: () => 'FAKE_TOKEN'
}))

import medidasService from '../../../src/services/medidasService.js'

describe('MedidasService', () => {
  const makeResponse = (ok, data, status = 200, contentType = 'application/json') => ({
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad',
    headers: { get: () => contentType },
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data))
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  test('obtenerMedidas retorna datos', async () => {
    const payload = [{ id: 1, nombre: 'Kg' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await medidasService.obtenerMedidas()
    expect(res).toEqual(payload)
    expect(global.fetch).toHaveBeenCalled()
  })

  test('crearMedida realiza POST y retorna creado', async () => {
    const nueva = { nombre: 'Litro' }
    const created = { id: 2, ...nueva }
    global.fetch.mockResolvedValue(makeResponse(true, created))
    const res = await medidasService.crearMedida(nueva)
    expect(res).toEqual(created)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(opts.body).toEqual(JSON.stringify(nueva))
  })

  test('cambiarEstadoMedida realiza PATCH y retorna respuesta', async () => {
    const payload = { id: 3, activo: true }
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await medidasService.cambiarEstadoMedida(3, true)
    expect(res).toEqual(payload)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('PATCH')
    expect(opts.body).toEqual(JSON.stringify({ activo: true }))
  })

  test('actualizarMedida realiza PUT y retorna actualizado', async () => {
    const medida = { nombre: 'Editada' }
    const updated = { id: 5, ...medida }
    global.fetch.mockResolvedValue(makeResponse(true, updated))
    const res = await medidasService.actualizarMedida(5, medida)
    expect(res).toEqual(updated)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('PUT')
    expect(typeof opts.body).toBe('string')
  })

  test('eliminarMedida realiza DELETE y retorna respuesta', async () => {
    const payload = { success: true }
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await medidasService.eliminarMedida(8)
    expect(res).toEqual(payload)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('DELETE')
  })
})
