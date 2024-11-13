module.exports = {
  require: ['ts-node/register'],
  extension: ['ts'],
  spec: [
    'categoryService.test.ts',
    'holdingService.test.ts',
    'portfolioService.test.ts',
    'quoteService.test.ts',
    'stockService.test.ts',
    'transactionService.test.ts',
    'userService.test.ts',
    'yahooFinanceService.test.ts'
  ],
  timeout: 0,
  exit: true,
  ignore: ['../../integration/**/*.ts']
};
