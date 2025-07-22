import { EnvironmentVariables } from '../../src/credential-manager/constants';
import {
  calculateInstallationDifferencesImpl,
  checkEnvironmentImpl,
  getMissingInstallationsImpl,
  getUnverifiedInstallationsImpl,
  handlerImpl,
  leftJoinInstallationsForOneApp,
} from '../../src/credential-manager/installation-tracker/index.handler';
import { InstallationRecord } from '../../src/data';
import { EnvironmentError, GitHubError } from '../../src/error';

//TODO: Remove mock after Jest is able to build properly with Octokit

const mockGetInstallations = jest.fn();
const mockGetInstallationToken = jest.fn();
const mockGetAuthenticatedApp = jest.fn();
const installationTableName = 'baz';
const appTableName = 'foo';
let environment: { [key: string]: string | undefined };
jest.mock('../../src/gitHubService', () => {
  return {
    GitHubAPIService: jest.fn().mockImplementation(() => ({
      getInstallations: mockGetInstallations,
      getInstallationToken: mockGetInstallationToken,
      getAuthenticatedApp: mockGetAuthenticatedApp,
    })),
  };
});

beforeEach(() => {
  environment = { ...process.env };
  process.env[EnvironmentVariables.INSTALLATION_TABLE_NAME] =
    installationTableName;
  process.env[EnvironmentVariables.APP_TABLE_NAME] = appTableName;
});

describe('handlerImpl', () => {
  it('Returns unverified and missing installations list in API Gateway Proxy event when there are both missing and unverified installations', async () => {
    const putInstallationMock = jest.fn().mockResolvedValue(undefined);
    const mockSuccessResponse = [
      {
        id: 3,
        account: {
          node_id: 'baz',
        },
        app_id: 21,
      },
    ];

    mockGetInstallations.mockResolvedValue(mockSuccessResponse);
    const result = await handlerImpl({
      getAppIds: jest.fn().mockReturnValue([1, 3]),
      getMappedInstallationIds: jest.fn().mockReturnValue({
        1: [{ appId: 1, installationId: 20, nodeId: 'foo' }],
      }),
      getAppToken: jest.fn().mockReturnValue('some-token'),
      calculateInstallationDifferences: jest.fn().mockReturnValue({
        missingInstallations: [{ appId: 1, installationId: 20, nodeId: 'foo' }],
        unverifiedInstallations: [
          { appId: 3, installationId: 21, nodeId: 'baz' },
        ],
      }),
      putInstallation: putInstallationMock,
    });
    expect(result).toEqual({
      body: JSON.stringify({
        unverifiedInstallations: [
          { appId: 3, installationId: 21, nodeId: 'baz' },
        ],
        missingInstallations: [{ appId: 1, installationId: 20, nodeId: 'foo' }],
      }),
      statusCode: 200,
    });
    expect(putInstallationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 3,
        installationId: 3,
        nodeId: 'baz',
        tableName: expect.any(String),
        lastRefreshed: expect.any(String),
      }),
    );
  });
  it('Throws an error when running into errors', async () => {
    mockGetInstallations.mockRejectedValue(
      new GitHubError(
        'GitHub API Error: status: 401, statusText: Unauthorized, error: Invalid token',
      ),
    );
    await expect(
      handlerImpl({
        getAppIds: jest.fn().mockReturnValue([1, 3]),
        getMappedInstallationIds: jest.fn().mockReturnValue({
          1: [{ appId: 1, installationId: 20, nodeId: 'foo' }],
        }),
        getAppToken: jest.fn().mockReturnValue('some-token'),
      }),
    ).rejects.toThrow(GitHubError);
  });
});

describe('calculateInstallationDifferencesImpl', () => {
  it('Should return empty list when lists are empty', async () => {
    const result = await calculateInstallationDifferencesImpl({
      appIds: [],
      githubConfirmedInstallations: {},
      registeredInstallations: {},
    });
    expect(result).toEqual({
      missingInstallations: [],
      unverifiedInstallations: [],
    });
  });
  it('Should return a list for unverified installations', async () => {
    const result = await calculateInstallationDifferencesImpl({
      appIds: [1],
      githubConfirmedInstallations: {
        1: [{ appId: 1, installationId: 20, nodeId: 'foo' }],
      },
      registeredInstallations: [],
      getMissingInstallations: jest.fn(),
      getUnverifiedInstallations: jest
        .fn()
        .mockResolvedValue([{ appId: 1, installationId: 20, nodeId: 'foo' }]),
    });
    expect(result).toEqual({
      missingInstallations: [],
      unverifiedInstallations: [
        { appId: 1, installationId: 20, nodeId: 'foo' },
      ],
    });
  });
  it('Should return a list for missing installations', async () => {
    const result = await calculateInstallationDifferencesImpl({
      appIds: [1],
      githubConfirmedInstallations: {},
      registeredInstallations: {
        1: [{ appId: 1, installationId: 20, nodeId: 'foo' }],
      },
      getMissingInstallations: jest
        .fn()
        .mockResolvedValue([{ appId: 1, installationId: 20, nodeId: 'foo' }]),
      getUnverifiedInstallations: jest.fn(),
    });
    expect(result).toEqual({
      missingInstallations: [{ appId: 1, installationId: 20, nodeId: 'foo' }],
      unverifiedInstallations: [],
    });
  });
  it('Should return a list for both', async () => {
    const result = await calculateInstallationDifferencesImpl({
      appIds: [1, 3],
      githubConfirmedInstallations: {
        3: [{ appId: 3, installationId: 21, nodeId: 'baz' }],
      },
      registeredInstallations: {
        1: [{ appId: 1, installationId: 20, nodeId: 'foo' }],
      },
      getMissingInstallations: jest
        .fn()
        .mockResolvedValue([{ appId: 1, installationId: 20, nodeId: 'foo' }]),
      getUnverifiedInstallations: jest
        .fn()
        .mockResolvedValue([{ appId: 3, installationId: 21, nodeId: 'baz' }]),
    });
    expect(result).toEqual({
      missingInstallations: [{ appId: 1, installationId: 20, nodeId: 'foo' }],
      unverifiedInstallations: [
        { appId: 3, installationId: 21, nodeId: 'baz' },
      ],
    });
  });
});
describe('getUnverifiedInstallationsImpl', () => {
  const putInstallation = jest.fn();
  it('Should return empty list when both lists are empty', async () => {
    const result = await getUnverifiedInstallationsImpl({
      registeredInstallationsForAppId: [],
      gitHubInstallationsForAppId: [],
    });
    expect(result).toEqual([]);
  });
  it('Should return empty list if github installations is empty', async () => {
    const result = await getUnverifiedInstallationsImpl({
      registeredInstallationsForAppId: [
        { appId: 1, installationId: 20, nodeId: 'foo' },
      ],
      gitHubInstallationsForAppId: [],
      putInstallation,
    });
    expect(result).toEqual([]);
    expect(putInstallation).not.toHaveBeenCalled();
  });
  it('Should return github installations list if registered installations is empty', async () => {
    const result = await getUnverifiedInstallationsImpl({
      registeredInstallationsForAppId: [],
      gitHubInstallationsForAppId: [
        { appId: 1, installationId: 20, nodeId: 'foo' },
      ],
      putInstallation,
    });
    expect(result).toEqual([{ appId: 1, installationId: 20, nodeId: 'foo' }]);
    expect(putInstallation).toHaveBeenCalledTimes(1);
  });
  it('Should return github installations which are not present in registered installations', async () => {
    const result = await getUnverifiedInstallationsImpl({
      registeredInstallationsForAppId: [
        { appId: 1, installationId: 20, nodeId: 'foo' },
        { appId: 2, installationId: 21, nodeId: 'baz' },
      ],
      gitHubInstallationsForAppId: [
        { appId: 1, installationId: 20, nodeId: 'foo' },
        { appId: 3, installationId: 22, nodeId: 'bar' },
        { appId: 4, installationId: 23, nodeId: 'random' },
      ],
      putInstallation,
    });
    expect(result).toEqual([
      { appId: 3, installationId: 22, nodeId: 'bar' },
      { appId: 4, installationId: 23, nodeId: 'random' },
    ]);
    expect(putInstallation).toHaveBeenCalledTimes(2);
  });
});

describe('getMissingInstallationsImpl', () => {
  const deleteInstallation = jest.fn();
  it('Should return empty list when both lists are empty', async () => {
    const result = await getMissingInstallationsImpl({
      registeredInstallationsForAppId: [],
      gitHubInstallationsForAppId: [],
    });
    expect(result).toEqual([]);
  });
  it('Should return empty list if registered installations is empty', async () => {
    const result = await getMissingInstallationsImpl({
      registeredInstallationsForAppId: [],
      gitHubInstallationsForAppId: [
        { appId: 1, installationId: 20, nodeId: 'foo' },
      ],
      deleteInstallation,
    });
    expect(result).toEqual([]);
    expect(deleteInstallation).not.toHaveBeenCalled();
  });
  it('Should return registered installations list if github installations is empty', async () => {
    const result = await getMissingInstallationsImpl({
      registeredInstallationsForAppId: [
        { appId: 1, installationId: 20, nodeId: 'foo' },
      ],
      gitHubInstallationsForAppId: [],
      deleteInstallation,
    });
    expect(result).toEqual([{ appId: 1, installationId: 20, nodeId: 'foo' }]);
    expect(deleteInstallation).toHaveBeenCalledTimes(1);
  });
  it('Should return registered installations which are not present in github installations', async () => {
    const result = await getMissingInstallationsImpl({
      registeredInstallationsForAppId: [
        { appId: 1, installationId: 20, nodeId: 'foo' },
        { appId: 3, installationId: 22, nodeId: 'bar' },
        { appId: 4, installationId: 23, nodeId: 'random' },
      ],
      gitHubInstallationsForAppId: [
        { appId: 1, installationId: 20, nodeId: 'foo' },
        { appId: 2, installationId: 21, nodeId: 'baz' },
      ],
      deleteInstallation,
    });
    expect(result).toEqual([
      { appId: 3, installationId: 22, nodeId: 'bar' },
      { appId: 4, installationId: 23, nodeId: 'random' },
    ]);
    expect(deleteInstallation).toHaveBeenCalledTimes(2);
  });
});

describe('leftJoinInstallationsForOneApp', () => {
  it('returns nothing for equivalent arrays', () => {
    const left: InstallationRecord[] = [
      { appId: 1, installationId: 2, nodeId: 'foo' },
      { appId: 3, installationId: 4, nodeId: 'bar' },
    ];
    const right: InstallationRecord[] = [
      { appId: 1, installationId: 2, nodeId: 'foo' },
      { appId: 3, installationId: 4, nodeId: 'bar' },
    ];
    const result = leftJoinInstallationsForOneApp(left, right);
    expect(result.length).toBe(0);
  });
  it('returns nothing if only right contains new entries', () => {
    const left: InstallationRecord[] = [
      { appId: 1, installationId: 2, nodeId: 'foo' },
    ];
    const right: InstallationRecord[] = [
      { appId: 1, installationId: 2, nodeId: 'foo' },
      { appId: 3, installationId: 4, nodeId: 'bar' },
    ];
    const result = leftJoinInstallationsForOneApp(left, right);
    expect(result.length).toBe(0);
  });
  it('returns entries unique to left if so', () => {
    const left: InstallationRecord[] = [
      { appId: 1, installationId: 2, nodeId: 'foo' },
      { appId: 3, installationId: 4, nodeId: 'bar' },
    ];
    const right: InstallationRecord[] = [
      { appId: 3, installationId: 4, nodeId: 'bar' },
    ];
    const result = leftJoinInstallationsForOneApp(left, right);
    expect(result.length).toBe(1);
    expect(result).toEqual([{ appId: 1, installationId: 2, nodeId: 'foo' }]);
  });
  it('returns entries with unique installation ID', () => {
    const left: InstallationRecord[] = [
      { appId: 1, installationId: 2, nodeId: 'bar' },
      { appId: 1, installationId: 4, nodeId: 'bar' },
    ];
    const right: InstallationRecord[] = [
      { appId: 1, installationId: 4, nodeId: 'bar' },
    ];
    const result = leftJoinInstallationsForOneApp(left, right);
    expect(result.length).toBe(1);
    expect(result).toEqual([{ appId: 1, installationId: 2, nodeId: 'bar' }]);
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
      installationTableName,
      appTableName,
    });
  });
});
