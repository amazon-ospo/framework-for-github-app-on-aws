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
    // Assuming the GitHub App has these permissions granted
    mockGetInstallationToken.mockResolvedValue({
      token: 'installation-access-token',
      expires_at: '2017-07-08T16:18:44-04:00',
      permissions: {
        contents: 'read',
        metadata: 'read',
        pull_requests: 'write',
      },
      repository_selection: 'selected',
    });

    const result = await getInstallationAccessTokenImpl({
      appId: 1234,
      nodeId: 'test-id',
      appTable: 'AppTable',
      installationTable: 'InstallationTable',
      getAppToken: jest.fn().mockResolvedValue({ appToken: 'app-token' }),
      getInstallationId: jest.fn().mockResolvedValue(6789),
    });

    expect(result).toEqual({
      appId: 1234,
      nodeId: 'test-id',
      installationToken: 'installation-access-token',
      expirationTime: new Date('2017-07-08T16:18:44-04:00'),
      requestedScopeDown: undefined,
      actualScopeDown: {
        repositoryIds: undefined,
        repositoryNames: undefined,
        permissions: {
          contents: 'read',
          metadata: 'read',
          pull_requests: 'write',
        },
      },
    });
  });

  it('should return installation access token with repository ID scoping', async () => {
    mockGetInstallationToken.mockResolvedValue({
      token: 'scoped-installation-token',
      expires_at: '2017-07-08T16:18:44-04:00',
      permissions: { contents: 'read', metadata: 'read' },
      repository_selection: 'selected',
      repositories: [
        { id: 123456789, name: 'repo1' },
        { id: 987654321, name: 'repo2' },
      ],
    });

    const result = await getInstallationAccessTokenImpl({
      appId: 1234,
      nodeId: 'test-id',
      appTable: 'AppTable',
      installationTable: 'InstallationTable',
      scopeDown: { repositoryIds: [123456789, 987654321] },
      getAppToken: jest.fn().mockResolvedValue({ appToken: 'app-token' }),
      getInstallationId: jest.fn().mockResolvedValue(6789),
    });

    expect(result).toEqual({
      appId: 1234,
      nodeId: 'test-id',
      installationToken: 'scoped-installation-token',
      expirationTime: new Date('2017-07-08T16:18:44-04:00'),
      requestedScopeDown: { repositoryIds: [123456789, 987654321] },
      actualScopeDown: {
        repositoryIds: [123456789, 987654321],
        repositoryNames: ['repo1', 'repo2'],
        permissions: { contents: 'read', metadata: 'read' },
      },
    });
  });

  it('should return installation access token with repository name scoping', async () => {
    mockGetInstallationToken.mockResolvedValue({
      token: 'scoped-installation-token',
      expires_at: '2017-07-08T16:18:44-04:00',
      permissions: { contents: 'read', metadata: 'read' },
      repository_selection: 'selected',
      repositories: [
        { id: 456789123, name: 'repo1' },
        { id: 654321987, name: 'repo2' },
      ],
    });

    const result = await getInstallationAccessTokenImpl({
      appId: 1234,
      nodeId: 'test-id',
      appTable: 'AppTable',
      installationTable: 'InstallationTable',
      scopeDown: { repositoryNames: ['repo1', 'repo2'] },
      getAppToken: jest.fn().mockResolvedValue({ appToken: 'app-token' }),
      getInstallationId: jest.fn().mockResolvedValue(6789),
    });

    expect(result).toEqual({
      appId: 1234,
      nodeId: 'test-id',
      installationToken: 'scoped-installation-token',
      expirationTime: new Date('2017-07-08T16:18:44-04:00'),
      requestedScopeDown: { repositoryNames: ['repo1', 'repo2'] },
      actualScopeDown: {
        repositoryIds: [456789123, 654321987],
        repositoryNames: ['repo1', 'repo2'],
        permissions: { contents: 'read', metadata: 'read' },
      },
    });
  });

  it('should return installation access token with permission scoping', async () => {
    mockGetInstallationToken.mockResolvedValue({
      token: 'scoped-installation-token',
      expires_at: '2017-07-08T16:18:44-04:00',
      permissions: { contents: 'read', issues: 'write', metadata: 'read' },
      repository_selection: 'selected',
    });

    const result = await getInstallationAccessTokenImpl({
      appId: 1234,
      nodeId: 'test-id',
      appTable: 'AppTable',
      installationTable: 'InstallationTable',
      scopeDown: { permissions: { contents: 'read', issues: 'write' } },
      getAppToken: jest.fn().mockResolvedValue({ appToken: 'app-token' }),
      getInstallationId: jest.fn().mockResolvedValue(6789),
    });

    expect(result).toEqual({
      appId: 1234,
      nodeId: 'test-id',
      installationToken: 'scoped-installation-token',
      expirationTime: new Date('2017-07-08T16:18:44-04:00'),
      requestedScopeDown: {
        permissions: { contents: 'read', issues: 'write' },
      },
      actualScopeDown: {
        repositoryIds: undefined,
        repositoryNames: undefined,
        permissions: { contents: 'read', issues: 'write', metadata: 'read' },
      },
    });
  });

  it('should return installation access token with repository and permission scoping', async () => {
    mockGetInstallationToken.mockResolvedValue({
      token: 'fully-scoped-token',
      expires_at: '2017-07-08T16:18:44-04:00',
      permissions: {
        contents: 'read',
        pull_requests: 'write',
        metadata: 'read',
      },
      repository_selection: 'selected',
      repositories: [{ id: 789123456, name: 'specific-repo' }],
    });

    const result = await getInstallationAccessTokenImpl({
      appId: 1234,
      nodeId: 'test-id',
      appTable: 'AppTable',
      installationTable: 'InstallationTable',
      scopeDown: {
        repositoryIds: [789123456],
        repositoryNames: ['specific-repo'],
        permissions: { contents: 'read', pull_requests: 'write' },
      },
      getAppToken: jest.fn().mockResolvedValue({ appToken: 'app-token' }),
      getInstallationId: jest.fn().mockResolvedValue(6789),
    });

    expect(result).toEqual({
      appId: 1234,
      nodeId: 'test-id',
      installationToken: 'fully-scoped-token',
      expirationTime: new Date('2017-07-08T16:18:44-04:00'),
      requestedScopeDown: {
        repositoryIds: [789123456],
        repositoryNames: ['specific-repo'],
        permissions: { contents: 'read', pull_requests: 'write' },
      },
      actualScopeDown: {
        repositoryIds: [789123456],
        repositoryNames: ['specific-repo'],
        permissions: {
          contents: 'read',
          pull_requests: 'write',
          metadata: 'read',
        },
      },
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

  it.each([
    [
      'requesting permissions not granted to the app',
      { permissions: { xyz: 'write' } },
      'The permissions requested are not granted to this installation.',
    ],
    [
      'requested repositories do not exist or app not installed',
      { repositoryNames: ['nonexistent-repo'] },
      'There is at least one repository that does not exist or is not accessible to the parent installation.',
    ],
    [
      'requesting invalid permission values',
      { permissions: { issues: 'invalid' } },
      'There is at least one permission action that is not supported. It should be one of: "read", "write" or "admin".',
    ],
    [
      'repositoryId is invalid',
      { repositoryIds: [99] },
      'No repositories were provided.',
    ],
  ])(
    'should throw error when %s',
    async (_: string, scopeDown, errorMessage) => {
      mockGetInstallationToken.mockRejectedValue(new Error(errorMessage));

      await expect(
        getInstallationAccessTokenImpl({
          appId: 1234,
          nodeId: 'test-id',
          appTable: 'AppTable',
          installationTable: 'InstallationTable',
          scopeDown,
          getAppToken: jest.fn().mockResolvedValue('app-token'),
          getInstallationId: jest.fn().mockResolvedValue(6789),
        }),
      ).rejects.toThrow(errorMessage);
    },
  );
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
