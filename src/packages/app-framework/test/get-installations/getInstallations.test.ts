import { getInstallationRecordsImpl } from '../../src/credential-manager/get-installations/getInstallations';
import { InstallationRecord } from '../../src/data';
import { NotFound } from '../../src/error';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getInstallationRecordsImpl', () => {
  const mockNodeId = 'test-node-id';
  const mockInstallationTable = 'test-installation-table';
  const mockInstallationData: InstallationRecord[] = [
    {
      appId: 12345,
      installationId: 67890,
      nodeId: mockNodeId,
      targetType: 'Organization',
    },
    {
      appId: 54321,
      installationId: 98765,
      nodeId: mockNodeId,
      targetType: 'Organization',
    },
  ];

  it('should successfully return installation data', async () => {
    const mockGetInstallations = jest
      .fn()
      .mockResolvedValue({ installations: mockInstallationData });

    const result = await getInstallationRecordsImpl({
      installationTable: mockInstallationTable,
      getInstallations: mockGetInstallations,
    });

    expect(result).toEqual({
      installations: mockInstallationData,
    });
  });

  it('should successfully return installation data and return last evaluated key when found', async () => {
    const mockGetInstallations = jest.fn().mockResolvedValue({
      installations: mockInstallationData,
      LastEvaluatedKey: 'encodedKey',
    });

    const result = await getInstallationRecordsImpl({
      installationTable: mockInstallationTable,
      Limit: 10,
      getInstallations: mockGetInstallations,
    });

    expect(result).toEqual({
      installations: mockInstallationData,
      nextToken: 'encodedKey',
    });
  });

  it('should throw NotFound error when getInstallationRecords throws NotFound', async () => {
    const notFoundError = new NotFound('No installations found');
    const mockGetInstallations = jest.fn().mockRejectedValue(notFoundError);

    await expect(
      getInstallationRecordsImpl({
        installationTable: mockInstallationTable,
        getInstallations: mockGetInstallations,
      }),
    ).rejects.toThrow(NotFound);
  });

  it('should throw ServerError when getInstallationRecords throws a DynamoDB error', async () => {
    const dynamoError = new Error('DynamoDB service error');
    const mockGetInstallations = jest.fn().mockRejectedValue(dynamoError);

    await expect(
      getInstallationRecordsImpl({
        installationTable: mockInstallationTable,
        getInstallations: mockGetInstallations,
      }),
    ).rejects.toThrow('Server error while retrieving installations');
  });
});
