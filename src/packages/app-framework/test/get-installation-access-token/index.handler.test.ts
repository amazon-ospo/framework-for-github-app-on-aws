import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { EnvironmentVariables } from '../../src/credential-manager/constants';
import {
  checkEnvironmentImpl,
  handlerImpl,
} from '../../src/credential-manager/get-installation-access-token/index.handler';
import { EnvironmentError } from '../../src/error';
import { apiGatewayEventHelper } from '../helper';

const installationTable = 'baz';
const appTable = 'foo';
let environment: { [key: string]: string | undefined };

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
beforeEach(() => {
  environment = { ...process.env };
  process.env[EnvironmentVariables.INSTALLATION_TABLE_NAME] = installationTable;
  process.env[EnvironmentVariables.APP_TABLE_NAME] = appTable;
});

describe('handlerImpl', () => {
  const path = '/tokens/installation';
  const nodeId = 'foo';
  const body = JSON.stringify({ appId: 1234, nodeId: nodeId });
  const mockCheckEnvironment = jest.fn().mockResolvedValue({
    appTable: 'appTable',
    installationTable: 'installationTable',
  });
  const mockGetInstallationAccessTokenOperation = jest.fn().mockResolvedValue({
    installationToken: 'test-token',
    nodeId,
    appId: 1234,
  });
  it('should return installation access token with app id and node id', async () => {
    const response: APIGatewayProxyResultV2 = await handlerImpl({
      event: apiGatewayEventHelper({ path, body }),
      getInstallationAccessTokenOperation:
        mockGetInstallationAccessTokenOperation,
      checkEnvironment: mockCheckEnvironment,
    });
    const parseResponse = JSON.parse(JSON.stringify(response));
    expect(parseResponse.body).toEqual(
      JSON.stringify({
        appId: 1234,
        installationToken: 'test-token',
        nodeId,
      }),
    );
  });
  it('should return internal server error for any error occuring inside of operation', async () => {
    const response: APIGatewayProxyResultV2 = await handlerImpl({
      event: apiGatewayEventHelper({ path, body }),
      checkEnvironment: mockCheckEnvironment,
    });
    const parseResponse = JSON.parse(JSON.stringify(response));
    expect(parseResponse.body).toEqual(
      JSON.stringify({ message: 'Internal Server Error' }),
    );
  });
  it('should return message for request error', async () => {
    const response: APIGatewayProxyResultV2 = await handlerImpl({
      event: apiGatewayEventHelper({
        path,
        body: JSON.stringify({ appId: 1234, nodeId: '' }),
      }),
      checkEnvironment: mockCheckEnvironment,
    });
    const parseResponse = JSON.parse(JSON.stringify(response));
    expect(parseResponse.body).toEqual(
      JSON.stringify({
        fieldList: [
          {
            message:
              "Value with length 0 at '/nodeId' failed to satisfy constraint: Member must have length between 1 and 256, inclusive",
            path: '/nodeId',
          },
        ],
        message:
          "1 validation error detected. Value with length 0 at '/nodeId' failed to satisfy constraint: Member must have length between 1 and 256, inclusive",
      }),
    );
  });
  it('should return empty json for any error occuring inside of operation', async () => {
    await expect(
      handlerImpl({
        event: apiGatewayEventHelper({ path, version: -1 }),
        checkEnvironment: mockCheckEnvironment,
      }),
    ).rejects.toThrow(TypeError);
  });
});

describe('checkEnvironmentImpl', () => {
  afterEach(() => {
    process.env = { ...environment };
  });

  it.each(Object.keys(EnvironmentVariables))(
    'fails when %s environment variable is not set',
    (value) => {
      delete process.env[value];

      expect(checkEnvironmentImpl).toThrow(EnvironmentError);
    },
  );

  it('returns expected values if all are present', () => {
    const response = checkEnvironmentImpl();
    expect(response).toEqual({
      installationTable,
      appTable,
    });
  });
});
