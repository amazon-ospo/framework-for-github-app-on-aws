import {
  getAppKeyArnByIdImpl,
  getInstallationIdFromTableImpl,
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
});
