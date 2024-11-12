module.exports = {
  require: ['ts-node/register'],
  extension: ['ts'],
  spec: [
    'environment.test.ts',
    'database.test.ts',
    'keycloak.test.ts'
  ],
  timeout: 0,
  exit: true,
  ignore: ['../../integration/**/*.ts']
};
