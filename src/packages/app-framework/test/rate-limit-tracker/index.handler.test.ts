import { Metrics } from '@aws-lambda-powertools/metrics';
import { EnvironmentVariables } from '../../src/credential-manager/constants';
import {
  checkEnvironmentImpl,
  handlerImpl,
} from '../../src/credential-manager/rate-limit-tracker/index.handler';
import { EnvironmentError, GitHubError } from '../../src/error';

//TODO: Remove mock after Jest is able to build properly with Octokit

const mockGetInstallations = jest.fn();
const mockGetInstallationToken = jest.fn();
const mockGetAuthenticatedApp = jest.fn();
const mockGetRateLimit = jest.fn();
const installationTable = 'baz';
const appTable = 'foo';
let environment: { [key: string]: string | undefined };
jest.mock('../../src/gitHubService', () => {
  return {
    GitHubAPIService: jest.fn().mockImplementation(() => ({
      getInstallations: mockGetInstallations,
      getInstallationToken: mockGetInstallationToken,
      getAuthenticatedApp: mockGetAuthenticatedApp,
      getRateLimit: mockGetRateLimit,
    })),
  };
});

beforeEach(() => {
  environment = { ...process.env };
  process.env[EnvironmentVariables.INSTALLATION_TABLE_NAME] = installationTable;
  process.env[EnvironmentVariables.APP_TABLE_NAME] = appTable;
});

describe('handlerImpl', () => {
  const addDimensionSpy = jest.spyOn(Metrics.prototype, 'addDimension');
  const addMetricSpy = jest.spyOn(Metrics.prototype, 'addMetric');
  const publishStoredMetricsSpy = jest.spyOn(
    Metrics.prototype,
    'publishStoredMetrics',
  );
  // it('Publish metrics three times due to three different rate limits present in GitHub output', async () => {
  //   const rate_limit_response = {
  //     resources: {
  //       core: {
  //         limit: 5000,
  //         used: 1,
  //         remaining: 4999,
  //         reset: 1691591363,
  //       },
  //       search: {
  //         limit: 30,
  //         used: 12,
  //         remaining: 18,
  //         reset: 1691591091,
  //       },
  //       rate: {
  //         limit: 5000,
  //         used: 1,
  //         remaining: 4999,
  //         reset: 1372700873,
  //       },
  //     },
  //   };
  //   mockGetRateLimit.mockReturnValue(rate_limit_response);
  //   await handlerImpl({
  //     getInstallationsFromTable: jest
  //       .fn()
  //       .mockReturnValue([{ appId: 1, installationId: 20, nodeId: 'foo' }]),
  //     getInstallationAccessToken: jest
  //       .fn()
  //       .mockReturnValue({ installationToken: 'some-token' }),
  //   });
  //   expect(addDimensionSpy).toHaveBeenCalledTimes(9);
  //   expect(addMetricSpy).toHaveBeenCalledTimes(15);
  //   expect(publishStoredMetricsSpy).toHaveBeenCalledTimes(3);
  // });
  it('No metrics are published when rate limit API throws error', async () => {
    mockGetRateLimit.mockRejectedValue(
      new GitHubError(
        'GitHub API Error: status: 401, statusText: Unauthorized, error: Invalid token',
      ),
    );
    await expect(
      handlerImpl({
        getInstallationsFromTable: jest
          .fn()
          .mockReturnValue([{ appId: 1, installationId: 20, nodeId: 'foo' }]),
        getInstallationAccessToken: jest
          .fn()
          .mockReturnValue({ installationToken: 'some-token' }),
      }),
    ).rejects.toThrow(GitHubError);

    expect(addDimensionSpy).not.toHaveBeenCalled();
    expect(addMetricSpy).not.toHaveBeenCalled();
    expect(publishStoredMetricsSpy).not.toHaveBeenCalled();
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
