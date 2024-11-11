import { Response } from 'express';
import sinon from 'sinon';

export interface MockResponse extends Partial<Response> {
  status: sinon.SinonStub;
  json: sinon.SinonStub;
  send: sinon.SinonStub;
  end: sinon.SinonStub;
  setHeader: sinon.SinonStub;
  getHeader: sinon.SinonStub;
}

export const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis(),
    end: sinon.stub().returnsThis(),
    setHeader: sinon.stub().returnsThis(),
    getHeader: sinon.stub()
  };

  // Add commonly used helper methods
  res.status.returns(res);
  res.json.returns(res);
  res.send.returns(res);
  res.end.returns(res);
  res.setHeader.returns(res);

  return res;
};

// Helper function to verify response status and data
export const verifyResponse = (
  res: MockResponse,
  expectedStatus: number,
  expectedData?: any
) => {
  sinon.assert.calledWith(res.status, expectedStatus);
  if (expectedData !== undefined) {
    sinon.assert.calledWith(res.json, expectedData);
  }
};

// Helper function to verify error response
export const verifyErrorResponse = (
  res: MockResponse,
  expectedStatus: number,
  expectedError: string
) => {
  sinon.assert.calledWith(res.status, expectedStatus);
  sinon.assert.calledWith(res.json, sinon.match({
    error: sinon.match.string,
    message: expectedError
  }));
};
