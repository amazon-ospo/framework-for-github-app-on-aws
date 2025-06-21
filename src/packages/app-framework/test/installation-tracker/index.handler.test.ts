import { EnvironmentVariables } from '../../src/credential-manager/constants';
import {
  checkEnvironmentImpl,
  leftJoinInstallationsForOneApp,
} from '../../src/credential-manager/installation-tracker/index.handler';
import { InstallationRecord } from '../../src/data';
import { EnvironmentError } from '../../src/error';

//TODO: Remove mock after Jest is able to build properly with Octokit

const mockGetInstallations = jest.fn();
const mockGetInstallationToken = jest.fn();
const installationTableName = 'baz';
const appTableName = 'foo';
let environment: { [key: string]: string | undefined };
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
  process.env[EnvironmentVariables.INSTALLATION_TABLE_NAME] =
    installationTableName;
  process.env[EnvironmentVariables.APP_TABLE_NAME] = appTableName;
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
