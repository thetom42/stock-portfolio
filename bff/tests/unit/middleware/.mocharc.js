module.exports = {
  require: [
    'ts-node/register',
    '../../setup.ts'  // Include the mock database setup
  ],
  extension: ['ts'],
  spec: [
    'auth.test.ts',
    'error.test.ts',
    'validation.test.ts'
  ],
  timeout: 0,
  exit: true,
  ignore: ['../../integration/**/*.ts']
};
