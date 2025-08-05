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
      expirationTime: new Date('2017-07-08T16:18:44-04:00'),
    });
  });

  it.each([
    [
      'should return installation access token with repository ID scoping',
      { repositoryIds: [123, 456] },
      {
        installationId: 6789,
        repositoryIds: [123, 456],
        repositoryNames: undefined,
        permissions: undefined,
      },
      {
        token: 'scoped-installation-token',
        expires_at: '2017-07-08T16:18:44-04:00',
        permissions: {},
        repository_selection: 'selected',
      },
    ],
    [
      'should return installation access token with repository name scoping',
      { repositoryNames: ['repo1', 'repo2'] },
      {
        installationId: 6789,
        repositoryIds: undefined,
        repositoryNames: ['repo1', 'repo2'],
        permissions: undefined,
      },
      {
        token: 'scoped-installation-token',
        expires_at: '2017-07-08T16:18:44-04:00',
        permissions: {},
        repository_selection: 'selected',
      },
    ],
    [
      'should return installation access token with permission scoping',
      { permissions: { contents: 'read', issues: 'write' } },
      {
        installationId: 6789,
        repositoryIds: undefined,
        repositoryNames: undefined,
        permissions: { contents: 'read', issues: 'write' },
      },
      {
        token: 'scoped-installation-token',
        expires_at: '2017-07-08T16:18:44-04:00',
        permissions: { contents: 'read', issues: 'write' },
        repository_selection: 'selected',
      },
    ],
    [
      'should return installation access token with repository and permission scoping',
      {
        repositoryIds: [789],
        repositoryNames: ['specific-repo'],
        permissions: { contents: 'read', pull_requests: 'write' },
      },
      {
        installationId: 6789,
        repositoryIds: [789],
        repositoryNames: ['specific-repo'],
        permissions: { contents: 'read', pull_requests: 'write' },
      },
      {
        token: 'fully-scoped-token',
        expires_at: '2017-07-08T16:18:44-04:00',
        permissions: { contents: 'read', pull_requests: 'write' },
        repository_selection: 'selected',
      },
    ],
  ])('%s', async (_: string, scopeDown, expectedCall, mockResponse) => {
    mockGetInstallationToken.mockResolvedValue(mockResponse);

    const result = await getInstallationAccessTokenImpl({
      appId: 1234,
      nodeId: 'test-id',
      appTable: 'AppTable',
      installationTable: 'InstallationTable',
      scopeDown,
      getAppToken: jest.fn().mockResolvedValue('app-token'),
      getInstallationId: jest.fn().mockResolvedValue(6789),
    });

    expect(mockGetInstallationToken).toHaveBeenCalledWith(expectedCall);
    expect(result).toEqual({
      appId: 1234,
      nodeId: 'test-id',
      installationToken: mockResponse.token,
      expirationTime: new Date('2017-07-08T16:18:44-04:00'),
    });
  });

  it('should throw error when installation token generation fails', async () => {
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

  it('should throw error when scoped token generation fails', async () => {
    mockGetInstallationToken.mockRejectedValue(
      new Error(
        'The permissions requested are not granted to this installation.',
      ),
    );

    await expect(
      getInstallationAccessTokenImpl({
        appId: 1234,
        nodeId: 'test-id',
        appTable: 'AppTable',
        installationTable: 'InstallationTable',
        scopeDown: {
          repositoryNames: ['specific-repo'],
          permissions: {
            contents: 'write',
          },
        },
        getAppToken: jest.fn().mockResolvedValue('app-token'),
        getInstallationId: jest.fn().mockResolvedValue(6789),
      }),
    ).rejects.toThrow(
      'The permissions requested are not granted to this installation.',
    );
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
