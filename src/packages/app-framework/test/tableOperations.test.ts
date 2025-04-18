import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { NotFound } from '../src/error';
import { TableOperations } from '../src/tableOperations';

const tableOperationsTest = new TableOperations({ TableName: 'Test' });

const mockDynamoDBClient = mockClient(DynamoDBClient);
afterEach(() => {
  mockDynamoDBClient.reset();
  jest.clearAllMocks();
});
beforeEach(() => {
  mockDynamoDBClient.reset();
});

const result = 'result';

describe('getItem', () => {
  it('should successfully return when receiving item', async () => {
    mockDynamoDBClient.on(GetItemCommand).resolves({
      Item: {
        Result: { S: result },
      },
    });
    const response = await tableOperationsTest.getItem();
    expect(response).toEqual({ Result: result });
  });
  it('should return NotFound error not receiving item', async () => {
    mockDynamoDBClient.on(GetItemCommand).resolves({});
    await expect(tableOperationsTest.getItem()).rejects.toThrow(NotFound);
  });
  it('should return error for any other error', async () => {
    mockDynamoDBClient
      .on(GetItemCommand)
      .rejects(new Error('DynamoDB service error'));
    await expect(tableOperationsTest.getItem()).rejects.toThrow(
      'Error getting item from Test',
    );
  });
});
