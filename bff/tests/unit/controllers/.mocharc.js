module.exports = {
    require: ['ts-node/register'],
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
  