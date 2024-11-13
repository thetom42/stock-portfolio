import { Response } from 'express-serve-static-core';
import sinon from 'sinon';
import { expect } from 'chai';

export type MockResponse = Partial<Response> & {
  status: sinon.SinonStub;
  json: sinon.SinonStub;
  send: sinon.SinonStub;
  end: sinon.SinonStub;
  setHeader: sinon.SinonStub;
  getHeader: sinon.SinonStub;
  sendStatus: sinon.SinonStub;
};

export const createMockResponse = (): MockResponse => {
  // Create a base object to hold all methods
  const res: any = {};

  // Create stubs with proper chaining
  res.status = sinon.stub().callsFake(() => res);
  res.json = sinon.stub().callsFake(() => res);
  res.send = sinon.stub().callsFake(() => res);
  res.end = sinon.stub().callsFake(() => res);
  res.setHeader = sinon.stub().callsFake(() => res);
  res.getHeader = sinon.stub().callsFake(() => res);
  res.sendStatus = sinon.stub().callsFake(() => res);

  return res as MockResponse;
};

// Helper function to verify response status and data
export const verifyResponse = (
  res: MockResponse,
  expectedStatus: number,
  expectedData?: any
) => {
  // Check if status was explicitly set, otherwise assume 200 (Express default)
  const statusCall = res.status.getCall(0);
  const actualStatus = statusCall ? statusCall.args[0] : 200;
  expect(actualStatus).to.equal(expectedStatus);

  if (expectedData !== undefined) {
    // Get the actual data passed to json
    const jsonCall = res.json.getCall(0);
    if (!jsonCall) {
      throw new Error('json was not called');
    }

    const actualData = jsonCall.args[0];
    
    if (expectedData.error) {
      // For error responses, check if either error or message property matches
      const actualError = actualData.error || actualData.message;
      if (actualError !== expectedData.error) {
        throw new Error(`Expected error "${expectedData.error}" but got "${actualError}"`);
      }
    } else {
      // For success responses, verify each expected property exists and matches
      Object.entries(expectedData).forEach(([key, value]) => {
        if (!(key in actualData)) {
          throw new Error(`Missing key "${key}" in response`);
        }
        
        // Use JSON.stringify for deep comparison of values
        if (JSON.stringify(actualData[key]) !== JSON.stringify(value)) {
          throw new Error(`Value mismatch for key "${key}". Expected ${JSON.stringify(value)} but got ${JSON.stringify(actualData[key])}`);
        }
      });
    }
  }
};

// Helper function to verify error response
export const verifyErrorResponse = (
  res: MockResponse,
  expectedStatus: number,
  expectedError: string
) => {
  // Check if status was explicitly set, otherwise assume 200 (Express default)
  const statusCall = res.status.getCall(0);
  const actualStatus = statusCall ? statusCall.args[0] : 200;
  expect(actualStatus).to.equal(expectedStatus);
  
  const jsonCall = res.json.getCall(0);
  if (!jsonCall) {
    throw new Error('json was not called');
  }

  const actualData = jsonCall.args[0];
  const actualError = actualData.error || actualData.message;
  if (actualError !== expectedError) {
    throw new Error(`Expected error "${expectedError}" but got "${actualError}"`);
  }
};
