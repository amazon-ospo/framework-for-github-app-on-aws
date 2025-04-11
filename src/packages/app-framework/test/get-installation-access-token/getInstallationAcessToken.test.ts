import {
  getInstallationIdImpl,
  getInstallationAccessTokenImpl,
} from '../../src/credential-manager/get-installation-access-token/getInstallationAccessToken';
import { GitHubError } from '../../src/error';
import { GitHubAPIService } from '../../src/gitHubService';
import { AppInstallationType } from '../../src/types';

jest.mock('../../src/gitHubService');
const mockGitHubService = GitHubAPIService as jest.MockedClass<
  typeof GitHubAPIService
>;
describe('getInstallationAccessTokenImpl', () => {
  it('should return installation access token with app id and node id', async () => {
    mockGitHubService.prototype.getInstallationToken.mockResolvedValue(
      'installation-access-token',
    );
    const result = await getInstallationAccessTokenImpl({
      appId: 1234,
      nodeId: 'test-id',
      appTable: 'AppTable',
      installationTable: 'InstallationTable',
      getAppToken: jest.fn().mockReturnValue('app-token'),
      getInstallationId: jest.fn().mockReturnValue(6789),
    });
    expect(result).toEqual({
      appId: 1234,
      nodeId: 'test-id',
      installationToken: 'installation-access-token',
    });
  });
});

describe('getInstallationIdImpl', () => {
  const appId = 1234;
  const nodeId = 'foo';
  const installationId = 3456;
  const installationTable = 'baz';
  const appToken = 'jwtToken';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should return Installation ID if able to find in table', async () => {
    const getInstallationIdFromTable = jest
      .fn()
      .mockReturnValue(installationId);
    const result = await getInstallationIdImpl({
      appId,
      nodeId,
      getInstallationIdFromTable,
      installationTable,
      appToken,
    });
    expect(result).toEqual(installationId);
  });
  it('should return Installation ID if able to find in GitHub output', async () => {
    const mockSuccessResponse: AppInstallationType[] = [
      {
        id: installationId,
        account: {
          node_id: nodeId,
        },
        app_id: appId,
      },
      {
        id: 789,
        account: {
          node_id: 'test',
        },
        app_id: 1011,
      },
    ];
    mockGitHubService.prototype.getInstallations.mockResolvedValue(
      mockSuccessResponse,
    );
    const result = await getInstallationIdImpl({
      appId,
      nodeId,
      installationTable,
      appToken,
    });
    expect(result).toEqual(installationId);
  });
  it('should thow error if Installation ID not found in GitHub output', async () => {
    const mockSuccessResponse = [
      {
        id: 788,
        account: {
          node_id: 'test',
        },
        app_id: 1010,
      },
      {
        id: 789,
        account: {
          node_id: 'test-2',
        },
        app_id: 1011,
      },
    ];

    mockGitHubService.prototype.getInstallations.mockResolvedValue(
      mockSuccessResponse,
    );

    await expect(
      getInstallationIdImpl({
        appId,
        nodeId,
        installationTable,
        appToken,
      }),
    ).rejects.toThrow(
      'GitHub API Error: Installation ID not found in response',
    );
  });
  it('should thow error if GitHub API has an error', async () => {
    mockGitHubService.prototype.getInstallations.mockRejectedValue(() => {
      throw new GitHubError(
        'GitHub API Error: status: 401, statusText: Unauthorized, error: Invalid token',
      );
    });

    await expect(
      getInstallationIdImpl({
        appId,
        nodeId,
        installationTable,
        appToken,
      }),
    ).rejects.toThrow(
      'GitHub API Error: status: 401, statusText: Unauthorized, error: Invalid token',
    );
  });
});
