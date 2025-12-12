# Pruebas con Jest

## Requisitos
- Node.js 18+
- npm 9+

## Instalación
- `npm install`

## Scripts
- `npm run test` ejecuta todas las pruebas
- `npm run test:watch` ejecuta en modo observación
- `npm run test:coverage` genera reporte de cobertura en `coverage/`

## Estructura
- `tests/unit` pruebas unitarias
- `tests/integration` pruebas de integración
- `tests/__mocks__` mocks globales

## Configuración
- Archivo `jest.config.js` con `jsdom`, transform `babel-jest` y `moduleNameMapper`
- Archivo `tests/setupTests.js` habilita `@testing-library/jest-dom`

## Ejemplo
- `tests/unit/example.test.js` incluye pruebas síncronas, asíncronas, mocks y React
