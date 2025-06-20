import { leftJoinInstallationsForOneApp } from '../../src/credential-manager/installation-tracker/index.handler';
import { InstallationRecord } from '../../src/data';

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

//\TODO

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
