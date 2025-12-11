import { jest, describe, test, expect } from '@jest/globals'
jest.mock('../../../src/constants/apiConstants', () => ({
  API_BASE_URL: 'http://localhost:8091',
  DEFAULT_HEADERS: { 'Content-Type': 'application/json' },
  API_ENDPOINTS: {
    AUTH: { REFRESH_TOKEN: '/api/auth/refresh-token' },
    ROLES: {
      GET_ALL: '/api/roles',
      GET_ALL_WITH_PERMISOS: '/api/roles/permisos',
      GET_BY_ID: '/api/roles/:id',
      CREATE: '/api/roles',
      UPDATE: '/api/roles/:id',
      DELETE: '/api/roles/:id',
      SEARCH: '/api/roles/search/:termino'
    }
  },
  buildApiUrl: (p) => `http://localhost:8091${p}`
}))

jest.mock('../../../src/features/auth/tokenStore', () => ({
  getToken: () => 'FAKE_TOKEN'
}))

import rolesService from '../../../src/services/rolesService.js'

describe('RolesService', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('obtenerRoles retorna lista', async () => {
    const payload = [{ id: 1, nombre: 'Admin' }]
    jest.spyOn(rolesService, 'authFetch').mockResolvedValue({ ok: true, json: async () => payload })
    const res = await rolesService.obtenerRoles()
    expect(res).toEqual(payload)
  })

  test('crearRol retorna creado', async () => {
    const nuevo = { nombre: 'Editor' }
    const created = { id: 10, ...nuevo }
    const spy = jest.spyOn(rolesService, 'authFetch').mockResolvedValue({ ok: true, json: async () => created })
    const res = await rolesService.crearRol(nuevo)
    expect(res).toEqual(created)
    const [url, options] = spy.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(typeof options.body).toBe('string')
  })

  test('actualizarRol retorna actualizado', async () => {
    const actualizado = { id: 3, nombre: 'Viewer' }
    const spy = jest.spyOn(rolesService, 'authFetch').mockResolvedValue({ ok: true, json: async () => actualizado })
    const res = await rolesService.actualizarRol(3, actualizado)
    expect(res).toEqual(actualizado)
    const [, options] = spy.mock.calls[0]
    expect(options.method).toBe('PUT')
  })

  test('eliminarRol retorna éxito', async () => {
    const payload = { success: true }
    const spy = jest.spyOn(rolesService, 'authFetch').mockResolvedValue({ ok: true, json: async () => payload })
    const res = await rolesService.eliminarRol(2)
    expect(res).toEqual(payload)
    const [, options] = spy.mock.calls[0]
    expect(options.method).toBe('DELETE')
  })

  test('cambiarEstadoRol actualiza activo', async () => {
    jest.spyOn(rolesService, 'obtenerRolPorId').mockResolvedValue({ id: 7, nombre: 'User', activo: false })
    jest.spyOn(rolesService, 'actualizarRol').mockResolvedValue({ id: 7, nombre: 'User', activo: true })
    const res = await rolesService.cambiarEstadoRol(7, true)
    expect(res.activo).toBe(true)
  })
})
