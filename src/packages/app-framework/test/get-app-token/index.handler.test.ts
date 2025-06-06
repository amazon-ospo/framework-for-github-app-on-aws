import {
  GetAppTokenOutput,
  ServerSideError,
} from '@framework.api/app-framework-ssdk';
import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { EnvironmentVariables } from '../../src/credential-manager/constants';
import {
  handlerImpl,
  checkEnvironmentImpl,
} from '../../src/credential-manager/get-app-token/appToken.handler';
import { EnvironmentError } from '../../src/error';
import { apiGatewayEventHelper } from '../helper';

//TODO: Remove mock after Jest is able to build properly with Octokit

const mockGetInstallations = jest.fn();
const mockGetInstallationToken = jest.fn();

jest.mock('../../src/gitHubService', () => {
  return {
    GitHubAPIService: jest.fn().mockImplementation(() => ({
      getInstallations: mockGetInstallations,
      getInstallationToken: mockGetInstallationToken,
    })),
  };
});

const appTable = 'mockAppTable';
let originalEnv: NodeJS.ProcessEnv;
beforeEach(() => {
  originalEnv = { ...process.env };
  process.env[EnvironmentVariables.APP_TABLE_NAME] = appTable;
});
afterEach(() => {
  process.env = originalEnv;
});
describe('handlerImpl', () => {
  const mockGetAppTokenOperation = jest.fn().mockResolvedValue({
    appId: 123456,
    appToken: 'mock-token',
  } satisfies GetAppTokenOutput);
  it('should return app token with appId', async () => {
    const path = 'tokens/app';
    const body = JSON.stringify({ appId: 123456 });
    const event = apiGatewayEventHelper({ path, body });
    const response: APIGatewayProxyResultV2 = await handlerImpl({
      event,
      getAppTokenOperation: mockGetAppTokenOperation,
      checkEnvironment: () => ({ tableName: appTable }),
    });
    const parseResponse = JSON.parse(JSON.stringify(response));
    expect(parseResponse.statusCode).toBe(200);
    expect(parseResponse.body).toEqual(
      JSON.stringify({
        appId: 123456,
        appToken: 'mock-token',
      }),
    );
  });
  it('should return request error if appId is 0', async () => {
    const path = 'tokens/app';
    const body = JSON.stringify({ appId: 0 });
    const badEvent = apiGatewayEventHelper({ path, body });
    const response: APIGatewayProxyResultV2 = await handlerImpl({
      event: badEvent,
      getAppTokenOperation: mockGetAppTokenOperation,
      checkEnvironment: () => ({ tableName: appTable }),
    });
    const parseResponse = JSON.parse(JSON.stringify(response));
    expect(parseResponse.body).toEqual(
      JSON.stringify({
        fieldList: [
          {
            message:
              "Value at '/appId' failed to satisfy constraint: Member must be greater than or equal to 1",
            path: '/appId',
          },
        ],
        message:
          "1 validation error detected. Value at '/appId' failed to satisfy constraint: Member must be greater than or equal to 1",
      }),
    );
  });
  it('should return request error if appId is missing', async () => {
    const path = 'tokens/app';
    const body = JSON.stringify({});
    const badEvent = apiGatewayEventHelper({ path, body });
    const response: APIGatewayProxyResultV2 = await handlerImpl({
      event: badEvent,
      getAppTokenOperation: mockGetAppTokenOperation,
      checkEnvironment: () => ({ tableName: appTable }),
    });
    const parseResponse = JSON.parse(JSON.stringify(response));
    expect(parseResponse.body).toEqual(
      JSON.stringify({
        fieldList: [
          {
            message:
              "Value at '/appId' failed to satisfy constraint: Member must not be null",
            path: '/appId',
          },
        ],
        message:
          "1 validation error detected. Value at '/appId' failed to satisfy constraint: Member must not be null",
      }),
    );
  });
  it('should return Internal Server Error if getAppTokenOperation fails', async () => {
    const mockRejectedValue = jest
      .fn()
      .mockRejectedValue(
        new ServerSideError({ message: 'Internal Server Error' }),
      );
    const path = 'tokens/app';
    const body = JSON.stringify({ appId: 123456 });
    const event = apiGatewayEventHelper({ path, body });
    const response = await handlerImpl({
      event,
      getAppTokenOperation: mockRejectedValue,
      checkEnvironment: () => ({ tableName: appTable }),
    });
    const parseResponse = JSON.parse(JSON.stringify(response));
    expect(parseResponse.body).toEqual(
      JSON.stringify({ message: 'Internal Server Error' }),
    );
  });
  it('should throw ServerSideError if environment variable is missing', async () => {
    delete process.env[EnvironmentVariables.APP_TABLE_NAME];
    const path = 'tokens/app';
    const body = JSON.stringify({ appId: 123456 });
    const event = apiGatewayEventHelper({ path, body });
    await expect(
      handlerImpl({
        event,
      }),
    ).rejects.toThrow(ServerSideError);
  });
});
describe('checkEnvironmentImpl', () => {
  it('should return expected table name', () => {
    const result = checkEnvironmentImpl();
    expect(result).toEqual({ tableName: appTable });
  });
  it('should throw EnvironmentError when APP_TABLE_NAME is missing', () => {
    delete process.env[EnvironmentVariables.APP_TABLE_NAME];
    expect(() => checkEnvironmentImpl()).toThrow(EnvironmentError);
  });
});
