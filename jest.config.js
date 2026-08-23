module = module || {};
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@queueflow/shared$': '<rootDir>/packages/shared/src/index.ts',
  },
  testMatch: ['**/*.test.ts'],
};
