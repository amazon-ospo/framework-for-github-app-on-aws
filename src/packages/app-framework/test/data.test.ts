import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { getAppKeyArnByIdImpl } from '../src/data';
import { NotFound, DataError } from '../src/error';
// Mock DynamoDB client
const mockDynamoDBClient = mockClient(DynamoDBClient);
afterEach(() => {
  mockDynamoDBClient.reset();
  jest.clearAllMocks();
});
describe('getKeyArnByID', () => {
  const mockAppId = 12345;
  const mockTableName = 'validAppTableName';
  const mockArn = 'arn:aws:kms:region:account:key/mock-key-id';
  beforeEach(() => {
    mockDynamoDBClient.reset();
  });
  it('should successfully retrieve KMS ARN from DynamoDB', async () => {
    mockDynamoDBClient.on(GetItemCommand).resolves({
      Item: {
        AppId: { N: mockAppId.toString() },
        KmsKeyArn: { S: mockArn },
      },
    });
    const result = await getAppKeyArnByIdImpl({
      appId: mockAppId,
      tableName: mockTableName,
    });
    expect(result).toBe(mockArn);
    expect(mockDynamoDBClient.calls()).toHaveLength(1);
    expect(mockDynamoDBClient.calls()[0].args[0].input).toEqual({
      TableName: mockTableName,
      Key: {
        AppId: { N: mockAppId.toString() },
      },
    });
  });
  it('should throw NotFound when no item is returned', async () => {
    mockDynamoDBClient.on(GetItemCommand).resolves({});
    await expect(
      getAppKeyArnByIdImpl({ appId: mockAppId, tableName: mockTableName }),
    ).rejects.toThrow(NotFound);
    expect(mockDynamoDBClient.calls()).toHaveLength(1);
  });
  it('should throw DataError when KmsKeyArn is missing', async () => {
    mockDynamoDBClient.on(GetItemCommand).resolves({
      Item: {
        AppId: { N: mockAppId.toString() },
      },
    });
    await expect(
      getAppKeyArnByIdImpl({ appId: mockAppId, tableName: mockTableName }),
    ).rejects.toThrow(DataError);
    expect(mockDynamoDBClient.calls()).toHaveLength(1);
  });
  it('should throw error when DynamoDB GetItemCommand fails', async () => {
    mockDynamoDBClient
      .on(GetItemCommand)
      .rejects(new Error('DynamoDB service error'));
    await expect(
      getAppKeyArnByIdImpl({ appId: mockAppId, tableName: mockTableName }),
    ).rejects.toThrow('DynamoDB service error');
    expect(mockDynamoDBClient.calls()).toHaveLength(1);
  });
});
