import {
  getInstallationIdImpl,
  getInstallationAccessTokenImpl,
} from '../../src/credential-manager/get-installation-access-token/getInstallationAccessToken';
import { GitHubError, NotFound } from '../../src/error';

const mockGetInstallations = jest.fn();
const mockGetInstallationToken = jest.fn();

//TODO: Remove mock after Jest is able to build properly with Octokit
jest.mock('../../src/gitHubService', () => {
  return {
    GitHubAPIService: jest.fn().mockImplementation(() => ({
      getInstallations: mockGetInstallations,
      getInstallationToken: mockGetInstallationToken,
    })),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getInstallationAccessTokenImpl', () => {
  it('should return installation access token with app id and node id', async () => {
    mockGetInstallationToken.mockResolvedValue({
      token: 'installation-access-token',
      expires_at: '2017-07-08T16:18:44-04:00',
      permissions: {},
      repository_selection: 'selected',
    });

    const result = await getInstallationAccessTokenImpl({
      appId: 1234,
      nodeId: 'test-id',
      appTable: 'AppTable',
      installationTable: 'InstallationTable',
      getAppToken: jest.fn().mockResolvedValue('app-token'),
      getInstallationId: jest.fn().mockResolvedValue(6789),
    });

    expect(result).toEqual({
      appId: 1234,
      nodeId: 'test-id',
      installationToken: 'installation-access-token',
    });
  });
  it('should throw error when receiving an error generating installation access token', async () => {
    mockGetInstallationToken.mockRejectedValue(
      new Error('Failed to generate token.'),
    );

    await expect(
      getInstallationAccessTokenImpl({
        appId: 1234,
        nodeId: 'test-id',
        appTable: 'AppTable',
        installationTable: 'InstallationTable',
        getAppToken: jest.fn().mockResolvedValue('app-token'),
        getInstallationId: jest.fn().mockResolvedValue(6789),
      }),
    ).rejects.toThrow('Failed to generate token.');
  });
});

describe('getInstallationIdImpl', () => {
  const appId = 1234;
  const nodeId = 'foo';
  const installationId = 3456;
  const installationTable = 'baz';
  const appToken = 'jwtToken';

  it('should return Installation ID if able to find in table', async () => {
    const getInstallationIdFromTable = jest
      .fn()
      .mockResolvedValue(installationId);

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
    const mockSuccessResponse = [
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

    mockGetInstallations.mockResolvedValue(mockSuccessResponse);

    const result = await getInstallationIdImpl({
      appId,
      nodeId,
      installationTable,
      appToken,
    });

    expect(result).toEqual(installationId);
  });

  it('should throw error if Installation ID not found in GitHub output', async () => {
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

    mockGetInstallations.mockResolvedValue(mockSuccessResponse);

    await expect(
      getInstallationIdImpl({
        appId,
        nodeId,
        installationTable,
        appToken,
      }),
    ).rejects.toThrow(NotFound);
  });

  it('should throw error if GitHub API has an error', async () => {
    mockGetInstallations.mockRejectedValue(
      new GitHubError(
        'GitHub API Error: status: 401, statusText: Unauthorized, error: Invalid token',
      ),
    );

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
