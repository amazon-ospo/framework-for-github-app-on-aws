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
        1: [
          {
            appId: 1,
            installationId: 20,
            nodeId: 'foo',
            targetType: 'Organization',
            name: 'test-org',
          },
        ],
      }),
      getAppToken: jest.fn().mockReturnValue('some-token'),
      calculateInstallationDifferences: jest.fn().mockReturnValue({
        missingInstallations: [
          {
            appId: 1,
            installationId: 20,
            nodeId: 'foo',
            targetType: 'Organization',
            name: 'test-org',
          },
        ],
        unverifiedInstallations: [
          {
            appId: 3,
            installationId: 21,
            nodeId: 'baz',
            targetType: 'Organization',
            name: 'test-org-2',
          },
        ],
      }),
      putInstallation: putInstallationMock,
    });
    expect(result).toEqual({
      body: JSON.stringify({
        unverifiedInstallations: [
          {
            appId: 3,
            installationId: 21,
            nodeId: 'baz',
            targetType: 'Organization',
            name: 'test-org-2',
          },
        ],
        missingInstallations: [
          {
            appId: 1,
            installationId: 20,
            nodeId: 'foo',
            targetType: 'Organization',
            name: 'test-org',
          },
        ],
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
          1: [
            {
              appId: 1,
              installationId: 20,
              nodeId: 'foo',
              targetType: 'Organization',
              name: 'test-org',
            },
          ],
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
        1: [
          {
            appId: 1,
            installationId: 20,
            nodeId: 'foo',
            targetType: 'Organization',
            name: 'test-org',
          },
        ],
      },
      registeredInstallations: [],
      getMissingInstallations: jest.fn(),
      getUnverifiedInstallations: jest.fn().mockResolvedValue([
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
      ]),
    });
    expect(result).toEqual({
      missingInstallations: [],
      unverifiedInstallations: [
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
      ],
    });
  });
  it('Should return a list for missing installations', async () => {
    const result = await calculateInstallationDifferencesImpl({
      appIds: [1],
      githubConfirmedInstallations: {},
      registeredInstallations: {
        1: [
          {
            appId: 1,
            installationId: 20,
            nodeId: 'foo',
            targetType: 'Organization',
            name: 'test-org',
          },
        ],
      },
      getMissingInstallations: jest.fn().mockResolvedValue([
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
      ]),
      getUnverifiedInstallations: jest.fn(),
    });
    expect(result).toEqual({
      missingInstallations: [
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
      ],
      unverifiedInstallations: [],
    });
  });
  it('Should return a list for both', async () => {
    const result = await calculateInstallationDifferencesImpl({
      appIds: [1, 3],
      githubConfirmedInstallations: {
        3: [
          {
            appId: 3,
            installationId: 21,
            nodeId: 'baz',
            targetType: 'Organization',
            name: 'test-org-2',
          },
        ],
      },
      registeredInstallations: {
        1: [
          {
            appId: 1,
            installationId: 20,
            nodeId: 'foo',
            targetType: 'Organization',
            name: 'test-org',
          },
        ],
      },
      getMissingInstallations: jest.fn().mockResolvedValue([
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
      ]),
      getUnverifiedInstallations: jest.fn().mockResolvedValue([
        {
          appId: 3,
          installationId: 21,
          nodeId: 'baz',
          targetType: 'Organization',
          name: 'test-org-2',
        },
      ]),
    });
    expect(result).toEqual({
      missingInstallations: [
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
      ],
      unverifiedInstallations: [
        {
          appId: 3,
          installationId: 21,
          nodeId: 'baz',
          targetType: 'Organization',
          name: 'test-org-2',
        },
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
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
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
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
      ],
      putInstallation,
    });
    expect(result).toEqual([
      {
        appId: 1,
        installationId: 20,
        nodeId: 'foo',
        targetType: 'Organization',
        name: 'test-org',
      },
    ]);
    expect(putInstallation).toHaveBeenCalledTimes(1);
  });
  it('Should return github installations which are not present in registered installations', async () => {
    const result = await getUnverifiedInstallationsImpl({
      registeredInstallationsForAppId: [
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
        {
          appId: 2,
          installationId: 21,
          nodeId: 'baz',
          targetType: 'Organization',
          name: 'test-org-2',
        },
      ],
      gitHubInstallationsForAppId: [
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
        {
          appId: 3,
          installationId: 22,
          nodeId: 'bar',
          targetType: 'Organization',
          name: 'test-org-3',
        },
        {
          appId: 4,
          installationId: 23,
          nodeId: 'random',
          targetType: 'Organization',
          name: 'test-org-4',
        },
      ],
      putInstallation,
    });
    expect(result).toEqual([
      {
        appId: 3,
        installationId: 22,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org-3',
      },
      {
        appId: 4,
        installationId: 23,
        nodeId: 'random',
        targetType: 'Organization',
        name: 'test-org-4',
      },
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
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
      ],
      deleteInstallation,
    });
    expect(result).toEqual([]);
    expect(deleteInstallation).not.toHaveBeenCalled();
  });
  it('Should return registered installations list if github installations is empty', async () => {
    const result = await getMissingInstallationsImpl({
      registeredInstallationsForAppId: [
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
      ],
      gitHubInstallationsForAppId: [],
      deleteInstallation,
    });
    expect(result).toEqual([
      {
        appId: 1,
        installationId: 20,
        nodeId: 'foo',
        targetType: 'Organization',
        name: 'test-org',
      },
    ]);
    expect(deleteInstallation).toHaveBeenCalledTimes(1);
  });
  it('Should return registered installations which are not present in github installations', async () => {
    const result = await getMissingInstallationsImpl({
      registeredInstallationsForAppId: [
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
        {
          appId: 3,
          installationId: 22,
          nodeId: 'bar',
          targetType: 'Organization',
          name: 'test-org-3',
        },
        {
          appId: 4,
          installationId: 23,
          nodeId: 'random',
          targetType: 'Organization',
          name: 'test-org-4',
        },
      ],
      gitHubInstallationsForAppId: [
        {
          appId: 1,
          installationId: 20,
          nodeId: 'foo',
          targetType: 'Organization',
          name: 'test-org',
        },
        {
          appId: 2,
          installationId: 21,
          nodeId: 'baz',
          targetType: 'Organization',
          name: 'test-org-2',
        },
      ],
      deleteInstallation,
    });
    expect(result).toEqual([
      {
        appId: 3,
        installationId: 22,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org-3',
      },
      {
        appId: 4,
        installationId: 23,
        nodeId: 'random',
        targetType: 'Organization',
        name: 'test-org-4',
      },
    ]);
    expect(deleteInstallation).toHaveBeenCalledTimes(2);
  });
});

describe('leftJoinInstallationsForOneApp', () => {
  it('returns nothing for equivalent arrays', () => {
    const left: InstallationRecord[] = [
      {
        appId: 1,
        installationId: 2,
        nodeId: 'foo',
        targetType: 'Organization',
        name: 'test-org',
      },
      {
        appId: 3,
        installationId: 4,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org-2',
      },
    ];
    const right: InstallationRecord[] = [
      {
        appId: 1,
        installationId: 2,
        nodeId: 'foo',
        targetType: 'Organization',
        name: 'test-org',
      },
      {
        appId: 3,
        installationId: 4,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org-2',
      },
    ];
    const result = leftJoinInstallationsForOneApp(left, right);
    expect(result.length).toBe(0);
  });
  it('returns nothing if only right contains new entries', () => {
    const left: InstallationRecord[] = [
      {
        appId: 1,
        installationId: 2,
        nodeId: 'foo',
        targetType: 'Organization',
        name: 'test-org',
      },
    ];
    const right: InstallationRecord[] = [
      {
        appId: 1,
        installationId: 2,
        nodeId: 'foo',
        targetType: 'Organization',
        name: 'test-org',
      },
      {
        appId: 3,
        installationId: 4,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org-2',
      },
    ];
    const result = leftJoinInstallationsForOneApp(left, right);
    expect(result.length).toBe(0);
  });
  it('returns entries unique to left if so', () => {
    const left: InstallationRecord[] = [
      {
        appId: 1,
        installationId: 2,
        nodeId: 'foo',
        targetType: 'Organization',
        name: 'test-org',
      },
      {
        appId: 3,
        installationId: 4,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org-2',
      },
    ];
    const right: InstallationRecord[] = [
      {
        appId: 3,
        installationId: 4,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org-2',
      },
    ];
    const result = leftJoinInstallationsForOneApp(left, right);
    expect(result.length).toBe(1);
    expect(result).toEqual([
      {
        appId: 1,
        installationId: 2,
        nodeId: 'foo',
        targetType: 'Organization',
        name: 'test-org',
      },
    ]);
  });
  it('returns entries with unique installation ID', () => {
    const left: InstallationRecord[] = [
      {
        appId: 1,
        installationId: 2,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org',
      },
      {
        appId: 1,
        installationId: 4,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org',
      },
    ];
    const right: InstallationRecord[] = [
      {
        appId: 1,
        installationId: 4,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org',
      },
    ];
    const result = leftJoinInstallationsForOneApp(left, right);
    expect(result.length).toBe(1);
    expect(result).toEqual([
      {
        appId: 1,
        installationId: 2,
        nodeId: 'bar',
        targetType: 'Organization',
        name: 'test-org',
      },
    ]);
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
