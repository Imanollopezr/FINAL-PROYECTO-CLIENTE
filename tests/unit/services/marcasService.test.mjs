import { jest, describe, test, expect, beforeEach } from '@jest/globals'

await jest.unstable_mockModule('../../../src/constants/apiConstants.js', () => ({
  DEFAULT_HEADERS: { 'Content-Type': 'application/json' },
  API_ENDPOINTS: {
    MARCAS: {
      GET_ALL: '/api/marcas',
      CREATE: '/api/marcas',
      UPDATE: '/api/marcas/:id',
      DELETE: '/api/marcas/:id',
      CAMBIAR_ESTADO: '/api/marcas/:id/estado'
    }
  },
  buildApiUrl: (p) => `http://localhost:8091${p}`
}))

const marcasService = (await import('../../../src/services/marcasService.js')).default

describe('MarcasService', () => {
  const makeResponse = (ok, data) => ({ ok, status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Bad', json: async () => data })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  test('obtenerMarcas retorna lista', async () => {
    const payload = [{ id: 1, nombre: 'MarcaX' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await marcasService.obtenerMarcas()
    expect(res).toEqual(payload)
  })

  test('crearMarca realiza POST', async () => {
    const nueva = { nombre: 'Nueva' }
    const created = { id: 2, ...nueva }
    global.fetch.mockResolvedValue(makeResponse(true, created))
    const res = await marcasService.crearMarca(nueva)
    expect(res).toEqual(created)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
  })

  test('cambiarEstadoMarca realiza PATCH', async () => {
    const payload = { id: 1, activo: false }
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await marcasService.cambiarEstadoMarca(1, false)
    expect(res).toEqual(payload)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('PATCH')
  })

  test('actualizarMarca realiza PUT y retorna actualizado', async () => {
    const marca = { nombre: 'Editada' }
    const updated = { id: 3, ...marca }
    global.fetch.mockResolvedValue(makeResponse(true, updated))
    const res = await marcasService.actualizarMarca(3, marca)
    expect(res).toEqual(updated)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('PUT')
  })

  test('eliminarMarca realiza DELETE y retorna json', async () => {
    const payload = { ok: true }
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await marcasService.eliminarMarca(4)
    expect(res).toEqual(payload)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('DELETE')
  })
})
