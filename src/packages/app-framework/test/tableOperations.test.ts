import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
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

describe('putItem', () => {
  it('should successfully call DynamoDB', async () => {
    await tableOperationsTest.putItem({ item: { S: 'Foo' } });

    expect(mockDynamoDBClient.commandCalls(PutItemCommand)).toHaveLength(1);
    expect(
      mockDynamoDBClient.commandCalls(PutItemCommand, {
        TableName: 'Test',
        Item: { item: { S: 'Foo' } },
      }),
    ).toHaveLength(1);
  });

  it('should throw an error if DynamoDB throws an error', async () => {
    mockDynamoDBClient
      .on(PutItemCommand)
      .rejects(new Error('DynamoDB service error'));

    await expect(
      tableOperationsTest.putItem({ item: { S: 'Foo' } }),
    ).rejects.toThrow(
      'Error putting item in Test: Error: DynamoDB service error',
    );
  });
});

describe('scan', () => {
  it('should call DynamoDB with ScanCommand', async () => {
    mockDynamoDBClient.resolves({
      Items: [{ item: { S: 'Foo' } }],
    });

    const scanResult = await tableOperationsTest.scan();

    expect(scanResult.length).toBe(1);
    expect(scanResult[0]).toEqual({ item: 'Foo' });

    expect(mockDynamoDBClient.calls()).toHaveLength(1);
    const call = mockDynamoDBClient.calls()[0];
    expect(call.args[0].constructor.name).toBe('ScanCommand');
    expect(call.args[0].input).toEqual({
      TableName: 'Test',
    });
  });
});
