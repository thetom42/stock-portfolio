import type { Response, Request } from '../../src/types/express';
import sinon from 'sinon';
import { expect } from 'chai';

// Create a type that matches the Express Response interface
export interface MockResponse extends Partial<Response> {
  status: sinon.SinonStub;
  json: sinon.SinonStub;
  send: sinon.SinonStub;
  end: sinon.SinonStub;
  setHeader: sinon.SinonStub;
  getHeader: sinon.SinonStub;
  sendStatus: sinon.SinonStub;
  locals: any;
  headersSent: boolean;
  app: any;
  req: Request;
  statusCode: number;
  statusMessage: string;
  charset: string;
  links: sinon.SinonStub;
  jsonp: sinon.SinonStub;
  sendFile: sinon.SinonStub;
  sendfile: sinon.SinonStub;
  download: sinon.SinonStub;
  contentType: sinon.SinonStub;
  type: sinon.SinonStub;
  format: sinon.SinonStub;
  attachment: sinon.SinonStub;
  set: sinon.SinonStub;
  header: sinon.SinonStub;
  get: sinon.SinonStub;
  clearCookie: sinon.SinonStub;
  cookie: sinon.SinonStub;
  location: sinon.SinonStub;
  redirect: sinon.SinonStub;
  render: sinon.SinonStub;
  vary: sinon.SinonStub;
  append: sinon.SinonStub;
}

export const createMockResponse = (): MockResponse => {
  // Create a base object with all required properties
  const res: MockResponse = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis(),
    end: sinon.stub().returnsThis(),
    setHeader: sinon.stub().returnsThis(),
    getHeader: sinon.stub().returnsThis(),
    sendStatus: sinon.stub().returnsThis(),
    locals: {},
    headersSent: false,
    app: {},
    req: {} as Request,
    statusCode: 200,
    statusMessage: 'OK',
    charset: 'utf-8',
    links: sinon.stub().returnsThis(),
    jsonp: sinon.stub().returnsThis(),
    sendFile: sinon.stub().returnsThis(),
    sendfile: sinon.stub().returnsThis(),
    download: sinon.stub().returnsThis(),
    contentType: sinon.stub().returnsThis(),
    type: sinon.stub().returnsThis(),
    format: sinon.stub().returnsThis(),
    attachment: sinon.stub().returnsThis(),
    set: sinon.stub().returnsThis(),
    header: sinon.stub().returnsThis(),
    get: sinon.stub().returnsThis(),
    clearCookie: sinon.stub().returnsThis(),
    cookie: sinon.stub().returnsThis(),
    location: sinon.stub().returnsThis(),
    redirect: sinon.stub().returnsThis(),
    render: sinon.stub().returnsThis(),
    vary: sinon.stub().returnsThis(),
    append: sinon.stub().returnsThis()
  };

  return res;
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
