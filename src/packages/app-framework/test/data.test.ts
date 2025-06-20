import {
  getAppKeyArnByIdImpl,
  getInstallationIdFromTableImpl,
  getAppIdsImpl,
  putInstallationImpl,
  getInstallationIdsImpl
} from '../src/data';
import { DataError, NotFound } from '../src/error';
import { TableOperations } from '../src/tableOperations';

jest.mock('../src/tableOperations');
const mockTableOperations = TableOperations as jest.MockedClass<
  typeof TableOperations
>;

beforeEach(() => {
  jest.clearAllMocks();
});

const mockAppId = 12345;
const mockTableName = 'validAppTableName';
const mockNodeId = 'foo';
const mockInstallationId = 123456;
const mockArn = 'arn:aws:kms:region:account:key/mock-key-id';
describe('getKeyArnByID', () => {
  it('should successfully retrieve KMS ARN from DynamoDB', async () => {
    mockTableOperations.prototype.getItem.mockResolvedValue({
      AppID: mockAppId,
      KmsKeyArn: mockArn,
    });
    const result = await getAppKeyArnByIdImpl({
      appId: mockAppId,
      tableName: mockTableName,
    });
    expect(result).toBe(mockArn);
    expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
    expect(TableOperations.prototype.getItem).toHaveBeenCalledWith({
      AppId: { N: mockAppId.toString() },
    });
  });

  it('should throw NotFound when no item is returned', async () => {
    mockTableOperations.prototype.getItem.mockRejectedValue(() => {
      throw new NotFound('Item not found');
    });
    await expect(
      getAppKeyArnByIdImpl({ appId: mockAppId, tableName: mockTableName }),
    ).rejects.toThrow(NotFound);
    expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
    expect(TableOperations.prototype.getItem).toHaveBeenCalledWith({
      AppId: { N: mockAppId.toString() },
    });
  });

  it('should throw DataError when KmsKeyArn is missing', async () => {
    mockTableOperations.prototype.getItem.mockResolvedValue({
      AppID: mockAppId,
    });
    await expect(
      getAppKeyArnByIdImpl({ appId: mockAppId, tableName: mockTableName }),
    ).rejects.toThrow(DataError);
    expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
    expect(TableOperations.prototype.getItem).toHaveBeenCalledWith({
      AppId: { N: mockAppId.toString() },
    });
  });

  it('should throw error when DynamoDB GetItemCommand fails', async () => {
    mockTableOperations.prototype.getItem.mockRejectedValue(() => {
      throw new Error('DyamoDB service error');
    });
    await expect(
      getAppKeyArnByIdImpl({ appId: mockAppId, tableName: mockTableName }),
    ).rejects.toThrow('DyamoDB service error');
    expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
    expect(TableOperations.prototype.getItem).toHaveBeenCalledWith({
      AppId: { N: mockAppId.toString() },
    });
  });
});

describe('getInstallationId', () => {
  it('should successfully retrieve Installation ID from DynamoDB', async () => {
    mockTableOperations.prototype.getItem.mockResolvedValue({
      AppID: mockAppId,
      NodeID: mockNodeId,
      InstallationID: mockInstallationId,
    });
    const result = await getInstallationIdFromTableImpl({
      appId: mockAppId,
      nodeId: mockNodeId,
      tableName: mockTableName,
    });
    expect(result).toBe(mockInstallationId);
    expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
    expect(TableOperations.prototype.getItem).toHaveBeenCalledWith({
      AppId: { N: mockAppId.toString() },
      NodeId: { S: mockNodeId },
    });
  });

  it('should throw NotFound when no item is returned', async () => {
    mockTableOperations.prototype.getItem.mockRejectedValue(() => {
      throw new NotFound('Item not found');
    });
    await expect(
      getInstallationIdFromTableImpl({
        appId: mockAppId,
        nodeId: mockNodeId,
        tableName: mockTableName,
      }),
    ).rejects.toThrow(NotFound);
    expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
    expect(TableOperations.prototype.getItem).toHaveBeenCalledWith({
      AppId: { N: mockAppId.toString() },
      NodeId: { S: mockNodeId },
    });
  });

  it('should throw DataError when InstallationID is missing', async () => {
    mockTableOperations.prototype.getItem.mockResolvedValue({
      AppID: mockAppId,
      NodeID: mockNodeId,
    });
    await expect(
      getInstallationIdFromTableImpl({
        appId: mockAppId,
        nodeId: mockNodeId,
        tableName: mockTableName,
      }),
    ).rejects.toThrow(DataError);
    expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
    expect(TableOperations.prototype.getItem).toHaveBeenCalledWith({
      AppId: { N: mockAppId.toString() },
      NodeId: { S: mockNodeId },
    });
  });

  it('should throw error when DynamoDB GetItemCommand fails', async () => {
    mockTableOperations.prototype.getItem.mockRejectedValue(() => {
      throw new Error('DyamoDB service error');
    });
    await expect(
      getInstallationIdFromTableImpl({
        appId: mockAppId,
        nodeId: mockNodeId,
        tableName: mockTableName,
      }),
    ).rejects.toThrow('DyamoDB service error');
    expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
    expect(TableOperations.prototype.getItem).toHaveBeenCalledWith({
      AppId: { N: mockAppId.toString() },
      NodeId: { S: mockNodeId },
    });
  });

  describe('getAppIds', () => {
    it('should successfully retrieve all AppIds from DynamoDB', async () => {
      mockTableOperations.prototype.scan.mockResolvedValue([
        { "AppId": { "N": mockAppId.toString() } },
        { "AppId": { "N": (mockAppId + 1).toString() } }
      ]);
      const result = await getAppIdsImpl({
        tableName: mockTableName,
      });
      expect(result).toContain(mockAppId);
      expect(result).toContain(mockAppId + 1);
      expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
      expect(mockTableOperations.prototype.scan).toHaveBeenCalled();
    });

    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.scan.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(getAppIdsImpl({
        tableName: mockTableName,
      })).rejects.toThrow('DynamoDB service error');
    });
  });

  describe('GetInstallations', () => {
    it('should successfully retrieve all AppIds from DynamoDB', async () => {
      mockTableOperations.prototype.scan.mockResolvedValue([
        { 
          "AppId": { "N": mockAppId.toString() },
          "InstallationId": { "N": mockInstallationId.toString() },
          "NodeId": { "S": mockNodeId },
        },
      ]);
      const result = await getInstallationIdsImpl({
        tableName: mockTableName,
      });
      expect(Object.keys(result).length).toBe(1);
      expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
      expect(mockTableOperations.prototype.scan).toHaveBeenCalled();
    });

    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.scan.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(getAppIdsImpl({
        tableName: mockTableName,
      })).rejects.toThrow('DynamoDB service error');
    });
  });

  describe('PutInstallation', () => {
    it('should successfully write an installation into DynamoDB', async () => {
      await putInstallationImpl({
        tableName: mockTableName,
        appId: mockAppId,
        installationId: mockInstallationId,
        nodeId: mockNodeId,
      });

      expect(TableOperations).toHaveBeenCalledWith({ TableName: mockTableName });
      expect(mockTableOperations.prototype.putItem).toHaveBeenCalledWith({
        "AppId": { "N": mockAppId.toString() },
        "InstallationId": { "N": mockInstallationId.toString() },
        "NodeId": { "S": mockNodeId },
      });
    });

    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.putItem.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(putInstallationImpl({
        tableName: mockTableName,
        appId: mockAppId,
        installationId: mockInstallationId,
        nodeId: mockNodeId,
      })).rejects.toThrow('DynamoDB service error');
    });
  });
});
