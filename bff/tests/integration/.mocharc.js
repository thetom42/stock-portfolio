module.exports = {
  require: [
    'ts-node/register/transpile-only',
    'dotenv/config',
    '../setup.ts'
  ],
  extension: ['ts'],
  spec: [
    'app.test.ts'
  ],
  timeout: 10000,
  exit: true,
  ignore: ['../unit/**/*.ts']
};
