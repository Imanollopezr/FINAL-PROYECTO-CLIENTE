import { jest, describe, test, expect } from '@jest/globals'

await jest.unstable_mockModule('../../../src/constants/apiConstants.js', () => ({
  DEFAULT_HEADERS: { 'Content-Type': 'application/json' },
  API_ENDPOINTS: {
    CLIENTES: {
      GET_ALL: '/api/clientes',
      CREATE: '/api/clientes',
      UPDATE: '/api/clientes/:id',
      DELETE: '/api/clientes/:id',
      BUSCAR: '/api/clientes/buscar/:termino',
      ME: '/api/clientes/me',
      ME_PEDIDOS: '/api/clientes/me/pedidos',
      CONTACTO: '/api/clientes/:id/contacto'
    }
  },
  buildApiUrl: (p) => `http://localhost:8091${p}`
}))

await jest.unstable_mockModule('../../../src/features/auth/tokenStore.js', () => ({
  getToken: () => 'FAKE_TOKEN'
}))

const clientesService = (await import('../../../src/services/clientesService.js')).default

describe('ClientesService', () => {
  const makeResponse = (ok, data) => ({ ok, status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Bad', json: async () => data, text: async () => JSON.stringify(data) })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  test('obtenerClientes retorna lista', async () => {
    const payload = [{ id: 1, nombre: 'Juan' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await clientesService.obtenerClientes()
    expect(res).toEqual(payload)
  })

  test('crearCliente realiza POST y retorna creado', async () => {
    const cliente = { nombre: 'Ana' }
    const created = { id: 2, ...cliente }
    global.fetch.mockResolvedValue(makeResponse(true, created))
    const res = await clientesService.crearCliente(cliente)
    expect(res).toEqual(created)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
  })

  test('eliminarCliente realiza DELETE y retorna json', async () => {
    const payload = { success: true }
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await clientesService.eliminarCliente(7)
    expect(res).toEqual(payload)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('DELETE')
  })

  test('buscar retorna lista', async () => {
    const payload = [{ id: 3, nombre: 'Ana' }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await clientesService.buscar('ana')
    expect(res).toEqual(payload)
  })

  test('obtenerMisPedidos retorna lista', async () => {
    const payload = [{ id: 1, total: 100 }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await clientesService.obtenerMisPedidos()
    expect(res).toEqual(payload)
  })
})
