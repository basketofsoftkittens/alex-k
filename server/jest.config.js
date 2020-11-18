// have to use this instead of placing in package.json in order to have multiple jest presets

const { jsWithTs: tsjPreset } = require('ts-jest/presets');

module.exports = {
  setupFiles: ['dotenv/config'],
  preset: '@shelf/jest-mongodb',
  testEnvironment: 'node',
  transform: {
    ...tsjPreset.transform,
  },
  moduleFileExtensions: ['ts', 'js'],
  rootDir: '.',
  moduleNameMapper: {
    '^models/(.*)$': '<rootDir>/src/models/$1',
    '^api/(.*)$': '<rootDir>/src/api/$1',
    '^services/(.*)$': '<rootDir>/src/services/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.history/'],
};
