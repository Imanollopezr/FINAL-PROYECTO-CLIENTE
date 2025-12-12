import { API_ENDPOINTS, buildApiUrl, API_BASE_URL } from '../../../src/constants/apiConstants.js'

describe('Colores endpoints', () => {
  test('COLORES define endpoints básicos', () => {
    const c = API_ENDPOINTS.COLORES
    expect(typeof c).toBe('object')
    expect(c.GET_ALL).toBe('/api/colores')
    expect(c.CREATE).toBe('/api/colores')
    expect(c.UPDATE).toBe('/api/colores/:id')
    expect(c.DELETE).toBe('/api/colores/:id')
    expect(c.GET_BY_ID).toBe('/api/colores/:id')
    expect(c.CAMBIAR_ESTADO).toBe('/api/colores/:id/estado')
  })

  test('buildApiUrl concatena correctamente', () => {
    expect(buildApiUrl('/path')).toBe(`${API_BASE_URL}/path`)
  })

  test('todos los endpoints de COLORES empiezan con /api/colores', () => {
    const c = API_ENDPOINTS.COLORES
    const values = Object.values(c)
    expect(values.every(v => String(v).startsWith('/api/colores'))).toBe(true)
  })

  test('buildApiUrl concatena rutas con mayúsculas sin alterar', () => {
    expect(buildApiUrl('/api/Auth/login')).toBe(`${API_BASE_URL}/api/Auth/login`)
    expect(buildApiUrl('/api/Usuarios')).toBe(`${API_BASE_URL}/api/Usuarios`)
  })

  test('buildApiUrl arma correctamente endpoint con parámetro id', () => {
    const endpoint = API_ENDPOINTS.COLORES.UPDATE.replace(':id', '123')
    expect(buildApiUrl(endpoint)).toBe(`${API_BASE_URL}/api/colores/123`)
  })
})
