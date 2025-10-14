import { getInstallationsDataImpl } from '../../src/credential-manager/get-installation-data/getInstallationData';
import { InstallationRecord } from '../../src/data';
import { NotFound } from '../../src/error';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getInstallationsDataImpl', () => {
  const mockNodeId = 'test-node-id';
  const mockInstallationTable = 'test-installation-table';
  const mockInstallationData: InstallationRecord[] = [
    {
      appId: 12345,
      installationId: 67890,
      nodeId: mockNodeId,
      targetType: 'Organization',
      name: 'test-org-1',
    },
    {
      appId: 54321,
      installationId: 98765,
      nodeId: mockNodeId,
      targetType: 'Organization',
      name: 'test-org-2',
    },
  ];

  it('should successfully return installation data when found', async () => {
    const mockGetInstallationsDataByNodeId = jest
      .fn()
      .mockResolvedValue(mockInstallationData);

    const result = await getInstallationsDataImpl({
      nodeId: mockNodeId,
      installationTable: mockInstallationTable,
      getInstallationsDataByNodeId: mockGetInstallationsDataByNodeId,
    });

    expect(result).toEqual({
      installations: mockInstallationData,
    });

    expect(mockGetInstallationsDataByNodeId).toHaveBeenCalledWith({
      nodeId: mockNodeId,
      tableName: mockInstallationTable,
    });
  });

  it('should throw NotFound error when getInstallationsDataByNodeId throws NotFound', async () => {
    const notFoundError = new NotFound('No installations found for node');
    const mockGetInstallationsDataByNodeId = jest
      .fn()
      .mockRejectedValue(notFoundError);

    await expect(
      getInstallationsDataImpl({
        nodeId: mockNodeId,
        installationTable: mockInstallationTable,
        getInstallationsDataByNodeId: mockGetInstallationsDataByNodeId,
      }),
    ).rejects.toThrow(NotFound);

    await expect(
      getInstallationsDataImpl({
        nodeId: mockNodeId,
        installationTable: mockInstallationTable,
        getInstallationsDataByNodeId: mockGetInstallationsDataByNodeId,
      }),
    ).rejects.toThrow('No installations found for node');

    expect(mockGetInstallationsDataByNodeId).toHaveBeenCalledWith({
      nodeId: mockNodeId,
      tableName: mockInstallationTable,
    });
  });

  it('should throw ServerError when getInstallationsDataByNodeId throws a DynamoDB error', async () => {
    const dynamoError = new Error('DynamoDB service error');
    const mockGetInstallationsDataByNodeId = jest
      .fn()
      .mockRejectedValue(dynamoError);

    await expect(
      getInstallationsDataImpl({
        nodeId: mockNodeId,
        installationTable: mockInstallationTable,
        getInstallationsDataByNodeId: mockGetInstallationsDataByNodeId,
      }),
    ).rejects.toThrow(
      `Server error while retrieving installation data for target: ${mockNodeId}`,
    );
  });

  it('should handle multiple installation data', async () => {
    const multipleInstallationData: InstallationRecord[] = [
      {
        appId: 12345,
        installationId: 67890,
        nodeId: mockNodeId,
        targetType: 'Organization',
        name: 'test-org-1',
      },
      {
        appId: 54321,
        installationId: 98765,
        nodeId: mockNodeId,
        targetType: 'Organization',
        name: 'test-org-2',
      },
      {
        appId: 11111,
        installationId: 22222,
        nodeId: mockNodeId,
        targetType: 'Organization',
        name: 'test-org-3',
      },
    ];
    const mockGetInstallationsDataByNodeId = jest
      .fn()
      .mockResolvedValue(multipleInstallationData);

    const result = await getInstallationsDataImpl({
      nodeId: mockNodeId,
      installationTable: mockInstallationTable,
      getInstallationsDataByNodeId: mockGetInstallationsDataByNodeId,
    });

    expect(result).toEqual({
      installations: multipleInstallationData,
    });

    expect(mockGetInstallationsDataByNodeId).toHaveBeenCalledWith({
      nodeId: mockNodeId,
      tableName: mockInstallationTable,
    });
  });
});
