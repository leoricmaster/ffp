/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  extensionsToTreatAsEsm: ['.ts'],
  // 在每个测试文件加载前设置环境变量（避免 import 阶段触发 env fail-fast）
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  // 允许 transform 纯 ESM 包（如 uuid v9 仍部分 ESM）
  transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
