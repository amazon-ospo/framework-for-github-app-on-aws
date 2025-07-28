import { EnvironmentVariables } from '../../src/credential-manager/constants';
import { handlerImpl } from '../../src/credential-manager/refresh/index.handler';
import { EnvironmentError } from '../../src/error';
import { apiGatewayEventHelper } from '../helper';

//TODO: Remove mock after Jest is able to build properly with Octokit
const path = '/installations/refresh';
const mockRefreshCachedDataOperation = jest.fn();
const mockCheckEnvironment = jest.fn();
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
describe('handlerImpl', () => {
  const envBackup = process.env;
  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...envBackup,
      [EnvironmentVariables.APP_TABLE_NAME]: 'AppTable',
      [EnvironmentVariables.INSTALLATION_TABLE_NAME]: 'InstallTable',
    };
  });
  afterEach(() => {
    process.env = envBackup;
  });
  it('returns success response with refreshed message and date', async () => {
    const isoSpy = jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('9999-99-99T00:00:00Z');
    mockCheckEnvironment.mockReturnValue({
      appTable: 'AppTable',
      installationTable: 'InstallTable',
    });
    mockRefreshCachedDataOperation.mockResolvedValue({
      message: 'Installation sync completed.',
      refreshedDate: new Date(),
    });
    const response = await handlerImpl({
      event: apiGatewayEventHelper({ path }),
      checkEnvironment: mockCheckEnvironment,
      refreshCachedDataOperation: mockRefreshCachedDataOperation,
    });
    const responseStr = JSON.stringify(response);
    const parseResponse = JSON.parse(responseStr);
    expect(parseResponse.statusCode).toBe(200);
    expect(JSON.parse(parseResponse.body)).toEqual({
      message: 'Installation sync completed.',
      refreshedDate: '9999-99-99T00:00:00Z',
    });
    expect(mockCheckEnvironment).toHaveBeenCalled();
    expect(mockRefreshCachedDataOperation).toHaveBeenCalled();
    isoSpy.mockRestore();
  });
  it('throws EnvironmentError if environment variables are missing', async () => {
    delete process.env[EnvironmentVariables.APP_TABLE_NAME];
    delete process.env[EnvironmentVariables.INSTALLATION_TABLE_NAME];
    await expect(() =>
      handlerImpl({
        event: apiGatewayEventHelper({ path }),
      }),
    ).rejects.toThrow(EnvironmentError);
  });
  it('throws error if refreshCachedDataOperation fails', async () => {
    mockCheckEnvironment.mockReturnValue({
      appTable: 'AppTable',
      installationTable: 'InstallTable',
    });
    const response = await handlerImpl({
      event: apiGatewayEventHelper({ path }),
      checkEnvironment: mockCheckEnvironment,
      refreshCachedDataOperation: jest
        .fn()
        .mockRejectedValue(new Error('Installation sync failed')),
    });
    const responseStr = JSON.stringify(response);
    const parseResponse = JSON.parse(responseStr);
    expect(parseResponse.statusCode).toBe(500);
  });
});
