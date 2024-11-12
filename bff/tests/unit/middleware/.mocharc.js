module.exports = {
  require: ['ts-node/register'],
  extension: ['ts'],
  spec: [
    'auth.test.ts',
    'validation.test.ts'
  ],
  timeout: 0,
  exit: true,
  ignore: ['../../integration/**/*.ts']
};
