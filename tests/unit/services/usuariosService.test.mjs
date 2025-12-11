import { jest, describe, test, expect, beforeEach } from '@jest/globals'

await jest.unstable_mockModule('../../../src/constants/apiConstants.js', () => ({
  API_BASE_URL: 'http://localhost:8091',
  API_ENDPOINTS: {
    USUARIOS: {
      GET_ALL: '/api/usuarios',
      GET_BY_ID: '/api/usuarios/:id',
      CREATE: '/api/usuarios',
      UPDATE: '/api/usuarios/:id',
      DELETE: '/api/usuarios/:id',
      SEARCH: '/api/usuarios/buscar/:termino'
    },
    AUTH: { LOGIN: '/api/auth/login' }
  }
}))

await jest.unstable_mockModule('../../../src/features/auth/tokenStore.js', () => ({
  getToken: () => 'FAKE_TOKEN'
}))

const usuariosService = (await import('../../../src/services/usuariosService.js')).default

describe('UsuariosService', () => {
  const makeResponse = (ok, data) => ({ ok, status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Bad', json: async () => data })

  beforeEach(() => {
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  test('obtenerTodos retorna lista', async () => {
    const payload = [{ id: 1, nombres: 'Juan', correo: 'j@a.com', idRol: 1, activo: true }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await usuariosService.obtenerTodos()
    expect(res).toEqual(payload)
  })

  test('crear valida y realiza POST', async () => {
    const usuario = { nombres: 'Ana', apellidos: 'Pérez', correo: 'ana@ex.com', clave: '123456', idRol: 1 }
    const created = { id: 2, ...usuario }
    global.fetch.mockResolvedValue(makeResponse(true, created))
    const res = await usuariosService.crear(usuario)
    expect(res).toEqual(created)
    const [, opts] = global.fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
  })

  test('login realiza POST y retorna datos', async () => {
    const payload = { token: 'abc' }
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await usuariosService.login({ correo: 'a@b.com', clave: '123456' })
    expect(res).toEqual(payload)
  })

  test('obtenerPorId retorna usuario', async () => {
    const usuario = { id: 3, nombres: 'Luis', correo: 'l@a.com', idRol: 2, activo: true }
    global.fetch.mockResolvedValue(makeResponse(true, usuario))
    const res = await usuariosService.obtenerPorId(3)
    expect(res).toEqual(usuario)
  })

  test('buscar retorna lista', async () => {
    const payload = [{ id: 4, nombres: 'Carlos', correo: 'c@x.com', idRol: 1, activo: true }]
    global.fetch.mockResolvedValue(makeResponse(true, payload))
    const res = await usuariosService.buscar('car')
    expect(res).toEqual(payload)
  })
})
