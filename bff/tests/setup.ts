import { expect } from 'chai';
import { before, after } from 'mocha';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Make chai's expect globally available
global.expect = expect;

// Add any other test setup here
before(async () => {
  // Setup test environment
});

after(async () => {
  // Cleanup test environment
});
