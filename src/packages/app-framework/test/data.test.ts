import {
  getAppKeyArnByIdImpl,
  getInstallationIdFromTableImpl,
  getAppIdsImpl,
  putInstallationImpl,
  getMappedInstallationIdsImpl,
  deleteInstallationImpl,
  getInstallationsImpl,
  getInstallationsDataByNodeId,
  getPaginatedInstallationsImpl,
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
const mockAppId2 = 12346;
const mockInstallationId2 = 123457;
const mockTargetType = 'Organization';
const mockName = 'test-org';
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
        { AppId: mockAppId },
        { AppId: mockAppId + 1 },
      ]);
      const result = await getAppIdsImpl({
        tableName: mockTableName,
      });
      expect(result).toContain(mockAppId);
      expect(result).toContain(mockAppId + 1);
      expect(TableOperations).toHaveBeenCalledWith({
        TableName: mockTableName,
      });
      expect(mockTableOperations.prototype.scan).toHaveBeenCalled();
    });

    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.scan.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(
        getAppIdsImpl({
          tableName: mockTableName,
        }),
      ).rejects.toThrow('DynamoDB service error');
    });
  });

  describe('GetMappedInstallations', () => {
    it('should successfully retrieve all AppIds from DynamoDB', async () => {
      mockTableOperations.prototype.scan.mockResolvedValue([
        {
          AppId: mockAppId,
          InstallationId: mockInstallationId,
          NodeId: mockNodeId,
        },
      ]);
      const result = await getMappedInstallationIdsImpl({
        tableName: mockTableName,
      });
      expect(Object.keys(result).length).toBe(1);
      expect(TableOperations).toHaveBeenCalledWith({
        TableName: mockTableName,
      });
      expect(mockTableOperations.prototype.scan).toHaveBeenCalled();
    });

    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.scan.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(
        getMappedInstallationIdsImpl({
          tableName: mockTableName,
        }),
      ).rejects.toThrow('DynamoDB service error');
    });
  });

  describe('PutInstallation', () => {
    it('should successfully write an installation into DynamoDB', async () => {
      await putInstallationImpl({
        tableName: mockTableName,
        appId: mockAppId,
        installationId: mockInstallationId,
        nodeId: mockNodeId,
        targetType: mockTargetType,
        name: mockName,
      });

      expect(TableOperations).toHaveBeenCalledWith({
        TableName: mockTableName,
      });
      expect(mockTableOperations.prototype.putItem).toHaveBeenCalledWith({
        AppId: { N: mockAppId.toString() },
        InstallationId: { N: mockInstallationId.toString() },
        LastRefreshed: { S: '' },
        NodeId: { S: mockNodeId },
        TargetType: { S: mockTargetType },
        Name: { S: mockName },
      });
    });

    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.putItem.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(
        putInstallationImpl({
          tableName: mockTableName,
          appId: mockAppId,
          lastRefreshed: '',
          installationId: mockInstallationId,
          nodeId: mockNodeId,
          targetType: mockTargetType,
          name: mockName,
        }),
      ).rejects.toThrow('DynamoDB service error');
    });
  });

  describe('DeleteInstallation', () => {
    it('should successfully delete an installation from DynamoDB', async () => {
      await deleteInstallationImpl({
        tableName: mockTableName,
        appId: mockAppId,
        nodeId: mockNodeId,
      });

      expect(TableOperations).toHaveBeenCalledWith({
        TableName: mockTableName,
      });
      expect(mockTableOperations.prototype.deleteItem).toHaveBeenCalledWith({
        AppId: { N: mockAppId.toString() },
        NodeId: { S: mockNodeId },
      });
    });

    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.deleteItem.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(
        deleteInstallationImpl({
          tableName: mockTableName,
          appId: mockAppId,
          nodeId: mockNodeId,
        }),
      ).rejects.toThrow('DynamoDB service error');
    });
  });

  describe('GetInstallations', () => {
    it('should successfully retrieve all AppIds from DynamoDB', async () => {
      mockTableOperations.prototype.scan.mockResolvedValue([
        {
          AppId: mockAppId,
          InstallationId: mockInstallationId,
          NodeId: mockNodeId,
        },
      ]);
      const result = await getInstallationsImpl({
        tableName: mockTableName,
      });
      expect(result).toEqual([
        {
          appId: mockAppId,
          nodeId: mockNodeId,
          installationId: mockInstallationId,
          targetType: undefined,
          name: '',
        },
      ]);
      expect(TableOperations).toHaveBeenCalledWith({
        TableName: mockTableName,
      });
      expect(mockTableOperations.prototype.scan).toHaveBeenCalled();
    });

    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.scan.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(
        getInstallationsImpl({
          tableName: mockTableName,
        }),
      ).rejects.toThrow('DynamoDB service error');
    });
  });

  describe('GetInstallationsByNodeId', () => {
    it('should successfully retrieve all installations for a specific nodeId from DynamoDB', async () => {
      mockTableOperations.prototype.query.mockResolvedValue([
        {
          AppId: mockAppId,
          InstallationId: mockInstallationId,
          NodeId: mockNodeId,
        },
        {
          AppId: mockAppId2,
          InstallationId: mockInstallationId2,
          NodeId: mockNodeId,
        },
      ]);
      const result = await getInstallationsDataByNodeId({
        nodeId: mockNodeId,
        tableName: mockTableName,
      });
      expect(result).toEqual([
        {
          appId: mockAppId,
          nodeId: mockNodeId,
          installationId: mockInstallationId,
          targetType: undefined,
          name: '',
        },
        {
          appId: mockAppId2,
          nodeId: mockNodeId,
          installationId: mockInstallationId2,
          targetType: undefined,
          name: '',
        },
      ]);
      expect(TableOperations).toHaveBeenCalledWith({
        TableName: mockTableName,
      });
      expect(mockTableOperations.prototype.query).toHaveBeenCalledWith({
        keyConditionExpression: 'NodeId = :nodeId',
        expressionAttributeValues: {
          ':nodeId': { S: mockNodeId },
        },
        indexName: 'NodeID',
      });
    });

    it('should throw NotFound when DynamoDB returns empty result set', async () => {
      mockTableOperations.prototype.query.mockResolvedValue([]);
      await expect(
        getInstallationsDataByNodeId({
          nodeId: mockNodeId,
          tableName: mockTableName,
        }),
      ).rejects.toThrow(NotFound);
      await expect(
        getInstallationsDataByNodeId({
          nodeId: mockNodeId,
          tableName: mockTableName,
        }),
      ).rejects.toThrow(`No installations found for node: ${mockNodeId}`);
      expect(TableOperations).toHaveBeenCalledWith({
        TableName: mockTableName,
      });
      expect(mockTableOperations.prototype.query).toHaveBeenCalledWith({
        keyConditionExpression: 'NodeId = :nodeId',
        expressionAttributeValues: {
          ':nodeId': { S: mockNodeId },
        },
        indexName: 'NodeID',
      });
    });

    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.query.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(
        getInstallationsDataByNodeId({
          nodeId: mockNodeId,
          tableName: mockTableName,
        }),
      ).rejects.toThrow('DynamoDB service error');
      expect(TableOperations).toHaveBeenCalledWith({
        TableName: mockTableName,
      });
      expect(mockTableOperations.prototype.query).toHaveBeenCalledWith({
        keyConditionExpression: 'NodeId = :nodeId',
        expressionAttributeValues: {
          ':nodeId': { S: mockNodeId },
        },
        indexName: 'NodeID',
      });
    });
  });

  describe('GetPaginatedInstallations', () => {
    it('should successfully retrieve all installations from DynamoDB', async () => {
      const LastEvaluatedKey = btoa(
        JSON.stringify({
          NodeId: {
            S: 'NODE_ID',
          },
          AppId: {
            N: 123456,
          },
        }),
      );
      mockTableOperations.prototype.paginated_scan.mockResolvedValue({
        LastEvaluatedKey,
        items: [
          {
            AppId: mockAppId,
            InstallationId: mockInstallationId,
            TargetType: mockTargetType,
          },
          {
            AppId: mockAppId2,
            InstallationId: mockInstallationId2,
            NodeId: mockNodeId,
            TargetType: mockTargetType,
          },
        ],
      });
      const result = await getPaginatedInstallationsImpl({
        tableName: mockTableName,
      });
      expect(result.LastEvaluatedKey).toEqual(LastEvaluatedKey);
      expect(result.installations).toEqual([
        {
          appId: mockAppId,
          nodeId: '',
          installationId: mockInstallationId,
          targetType: mockTargetType,
          name: '',
        },
        {
          appId: mockAppId2,
          nodeId: mockNodeId,
          installationId: mockInstallationId2,
          targetType: mockTargetType,
          name: '',
        },
      ]);
      expect(TableOperations).toHaveBeenCalledWith({
        TableName: mockTableName,
      });
      expect(mockTableOperations.prototype.paginated_scan).toHaveBeenCalled();
    });
    it('should throw an exception if DynamoDB call fails', async () => {
      mockTableOperations.prototype.paginated_scan.mockRejectedValue(() => {
        throw new Error('DynamoDB service error');
      });
      await expect(
        getPaginatedInstallationsImpl({
          tableName: mockTableName,
        }),
      ).rejects.toThrow('DynamoDB service error');
    });
  });
  it.each([
    {
      NodeId: {
        S: 12345,
      },
      AppId: {
        N: 123456,
      },
    },
    {
      NodeId: {
        S: 'NODE_ID',
      },
      AppId: {
        N: 'APP_ID',
      },
    },
    ,
    {},
    {
      AppId: {
        N: 123456,
      },
    },
    {
      NodeId: {
        S: 'NODE_ID',
      },
    },
  ])('fails when $s is the exclusive start key', async (value) => {
    await expect(
      getPaginatedInstallationsImpl({
        tableName: mockTableName,
        ExclusiveStartKey: btoa(JSON.stringify(value)),
      }),
    ).rejects.toThrow('Invalid ExclusiveStartKey provided');
  });
});
