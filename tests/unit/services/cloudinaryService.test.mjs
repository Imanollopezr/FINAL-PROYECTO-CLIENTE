import { describe, test, expect } from '@jest/globals'
import cloudinaryService, { getRandomPetImage, getRandomHeroImage, getMultipleRandomImages, getImageByCategory, transformCloudinaryImage } from '../../../src/services/cloudinaryService.js'

describe('CloudinaryService utilidades', () => {
  test('getRandomPetImage retorna una URL', () => {
    const url = getRandomPetImage()
    expect(typeof url).toBe('string')
    expect(url).toContain('unsplash.com')
  })

  test('getMultipleRandomImages retorna hasta cantidad solicitada sin duplicados', () => {
    const count = 5
    const list = getMultipleRandomImages(count)
    expect(new Set(list).size).toBe(list.length)
    expect(list.length).toBeLessThanOrEqual(count)
  })

  test('transformCloudinaryImage agrega parámetros a Unsplash', () => {
    const base = 'https://images.unsplash.com/photo-abc?w=100&h=100'
    const transformed = transformCloudinaryImage(base, { width: 400, height: 300, crop: 'crop', quality: 85 })
    expect(transformed).toContain('w=400')
    expect(transformed).toContain('h=300')
    expect(transformed).toContain('fit=crop')
  })

  test('getRandomHeroImage retorna una URL', () => {
    const url = getRandomHeroImage()
    expect(typeof url).toBe('string')
    expect(url).toContain('unsplash.com')
  })

  test('getImageByCategory retorna URL para categoría válida', () => {
    const url = getImageByCategory('alimento')
    expect(typeof url).toBe('string')
    expect(url).toContain('unsplash.com')
  })
})
