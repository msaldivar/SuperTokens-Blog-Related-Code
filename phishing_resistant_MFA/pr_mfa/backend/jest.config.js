// phishing_resistant_MFA/pr_mfa/backend/jest.config.js

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Basic TypeScript configuration needed for tests
          "target": "ES2022",
          "module": "commonjs",
          "esModuleInterop": true,
          "strict": false,  // Make TypeScript less strict for tests
          "noImplicitAny": false,
          "strictNullChecks": false,
          "skipLibCheck": true,
          "noUnusedLocals": false,  // Don't error on unused locals
          "noUnusedParameters": false,  // Don't error on unused parameters
          "forceConsistentCasingInFileNames": true,
          "types": ["jest", "node"]
        },
      },
    ],
  },
  maxWorkers: 1, // Run tests sequentially
  testTimeout: 30000, // 30 seconds timeout for auth operations
  verbose: true,
};