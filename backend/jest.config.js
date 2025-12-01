module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/migrations/',
    '/templates/'
  ],
  testTimeout: 30000,
  verbose: true
};
