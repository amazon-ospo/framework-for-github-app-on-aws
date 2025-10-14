import { refreshCachedDataImpl } from '../../src/credential-manager/refresh/refreshCachedData';
import { InstallationRecord } from '../../src/data';
import { ServerError } from '../../src/error';
import { GitHubAPIService } from '../../src/gitHubService';

const mockGetAppIds = jest.fn();
const mockGetMappedInstallationIds = jest.fn();
const mockGetAppToken = jest.fn();
const mockCalculateInstallationDifferences = jest.fn();
const mockPutInstallation = jest.fn();
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
const appTable = 'appTable';
const installationTable = 'installationTable';
const appId = 1111;
const appToken = 'token-123';
const githubInstallations = [{ id: 999, account: { node_id: 'node-abc' } }];
const existingInstallationInDDB: InstallationRecord = {
  appId,
  installationId: 888,
  nodeId: 'node-existing',
  targetType: 'Organization',
  name: 'existing-org',
};
describe('refreshCachedDataImpl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (GitHubAPIService as jest.Mock).mockImplementation(() => ({
      getInstallations: jest.fn().mockResolvedValue(githubInstallations),
    }));
  });
  it('returns a message and refreshed date on successful sync (no diffs)', async () => {
    mockGetAppIds.mockResolvedValue([appId]);
    mockGetMappedInstallationIds.mockResolvedValue({
      [appId]: [existingInstallationInDDB],
    });
    mockGetAppToken.mockResolvedValue({ appToken });
    mockCalculateInstallationDifferences.mockResolvedValue({
      unverifiedInstallations: [],
      missingInstallations: [],
    });
    mockPutInstallation.mockResolvedValue(undefined);
    const result = await refreshCachedDataImpl({
      appTable,
      installationTable,
      getAppIds: mockGetAppIds,
      getMappedInstallationIds: mockGetMappedInstallationIds,
      getAppToken: mockGetAppToken,
      calculateInstallationDifferences: mockCalculateInstallationDifferences,
      putInstallation: mockPutInstallation,
    });
    expect(result.message).toBe('Installation sync completed.');
    expect(result.refreshedDate).toBeInstanceOf(Date);
    expect(mockPutInstallation).toHaveBeenCalledTimes(1);
  });
  it('returns refreshed date on successful sync with two newly added diffs', async () => {
    const extraInstallationsFromGitHub = [
      { id: 999, account: { node_id: 'node-abc' } },
      { id: 1000, account: { node_id: 'node-def' } },
    ];
    const expectedUnverified: InstallationRecord[] = [
      {
        appId,
        installationId: 999,
        nodeId: 'node-abc',
        targetType: 'Organization',
        name: 'test-org-1',
      },
      {
        appId,
        installationId: 1000,
        nodeId: 'node-def',
        targetType: 'Organization',
        name: 'test-org-2',
      },
    ];
    (GitHubAPIService as jest.Mock).mockImplementation(() => ({
      getInstallations: jest
        .fn()
        .mockResolvedValue(extraInstallationsFromGitHub),
    }));
    mockGetAppIds.mockResolvedValue([appId]);
    mockGetMappedInstallationIds.mockResolvedValue({
      [appId]: [existingInstallationInDDB],
    });
    mockGetAppToken.mockResolvedValue({ appToken });
    mockCalculateInstallationDifferences.mockResolvedValue({
      unverifiedInstallations: expectedUnverified,
      missingInstallations: [],
    });
    mockPutInstallation.mockResolvedValue(undefined);
    const result = await refreshCachedDataImpl({
      appTable,
      installationTable,
      getAppIds: mockGetAppIds,
      getMappedInstallationIds: mockGetMappedInstallationIds,
      getAppToken: mockGetAppToken,
      calculateInstallationDifferences: mockCalculateInstallationDifferences,
      putInstallation: mockPutInstallation,
    });
    expect(result.message).toBe('Installation sync completed.');
    expect(result.refreshedDate).toBeInstanceOf(Date);
    expect(mockPutInstallation).toHaveBeenCalledTimes(2);
  });
  it('returns missing installations', async () => {
    mockGetAppIds.mockResolvedValue([appId]);
    mockGetMappedInstallationIds.mockResolvedValue({
      [appId]: [existingInstallationInDDB],
    });
    mockGetAppToken.mockResolvedValue({ appToken });
    mockCalculateInstallationDifferences.mockResolvedValue({
      unverifiedInstallations: [],
      missingInstallations: [existingInstallationInDDB],
    });
    const result = await refreshCachedDataImpl({
      appTable,
      installationTable,
      getAppIds: mockGetAppIds,
      getMappedInstallationIds: mockGetMappedInstallationIds,
      getAppToken: mockGetAppToken,
      calculateInstallationDifferences: mockCalculateInstallationDifferences,
      putInstallation: mockPutInstallation,
    });
    expect(result.message).toBe('Installation sync completed.');
    expect(result.refreshedDate).toBeInstanceOf(Date);
    expect(mockCalculateInstallationDifferences).toHaveBeenCalledTimes(1);
  });
  it('throws ServerError when getAppIds fails', async () => {
    mockGetAppIds.mockRejectedValue(new Error('Internal Server Error'));
    await expect(
      refreshCachedDataImpl({
        appTable,
        installationTable,
        getAppIds: mockGetAppIds,
        getMappedInstallationIds: mockGetMappedInstallationIds,
        getAppToken: mockGetAppToken,
        calculateInstallationDifferences: mockCalculateInstallationDifferences,
        putInstallation: mockPutInstallation,
      }),
    ).rejects.toThrow(ServerError);
  });
});
