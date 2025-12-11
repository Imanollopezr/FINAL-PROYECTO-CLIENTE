export default {
  verbose: true,
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  transform: {
    '^.+\\.[mjt]sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' }, modules: false }],
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      }
    ]
  },
  transformIgnorePatterns: ['<rootDir>/src/'],
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
    '^.+\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
    'apiConstants(\\.js)?$': '<rootDir>/tests/__mocks__/apiConstantsMock.js'
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,jsx}'],
  coverageDirectory: 'coverage',
  testMatch: ['**/?(*.)+(spec|test).{js,mjs,jsx,ts,tsx}']
}
