module.exports = {
  require: [
    'ts-node/register',
    '../../setup.ts'  // Include the mock database setup
  ],
  extension: ['ts'],
  spec: [
    'categoryController.test.ts',
    'holdingController.test.ts',
    'portfolioController.test.ts',
    'quoteController.test.ts',
    'stockController.test.ts',
    'transactionController.test.ts',
    'userController.test.ts'
  ],
  timeout: 0,
  exit: true,
  ignore: ['../../integration/**/*.ts']
};
