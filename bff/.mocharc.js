module.exports = {
  require: [
    'ts-node/register/transpile-only',
    'dotenv/config',
    './tests/setup.ts'
  ],
  extension: ['ts'],
  spec: 'tests/**/*.test.ts',
  timeout: 10000,
  exit: true
};
