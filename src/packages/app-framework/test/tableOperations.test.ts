import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
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

describe('deleteItem', () => {
  it('should successfully call DynamoDB', async () => {
    await tableOperationsTest.deleteItem({ Key: { S: 'Foo' } });

    expect(mockDynamoDBClient.commandCalls(DeleteItemCommand)).toHaveLength(1);
  });

  it('should throw an error if DynamoDB throws an error', async () => {
    mockDynamoDBClient
      .on(DeleteItemCommand)
      .rejects(new Error('DynamoDB service error'));

    await expect(
      tableOperationsTest.deleteItem({ Key: { S: 'Foo' } }),
    ).rejects.toThrow(
      'Error deleting item in Test: Error: DynamoDB service error',
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

describe('paginated_scan', () => {
  it('should call DynamoDB with ScanCommand', async () => {
    mockDynamoDBClient.resolves({
      Items: [{ item: { S: 'Foo' } }],
      LastEvaluatedKey: { item: { S: 'Baz' } },
    });

    const ExclusiveStartKey = btoa(JSON.stringify({ item: { S: 'Test' } }));
    const scanResult = await tableOperationsTest.paginated_scan({
      ExclusiveStartKey,
      Limit: 1,
    });

    expect(scanResult.items.length).toBe(1);
    expect(scanResult.items[0]).toEqual({ item: 'Foo' });
    const lastEvaluatedKey = btoa(JSON.stringify({ item: { S: 'Baz' } }));
    expect(scanResult.LastEvaluatedKey).toEqual(lastEvaluatedKey);

    expect(mockDynamoDBClient.calls()).toHaveLength(1);
    const call = mockDynamoDBClient.calls()[0];
    expect(call.args[0].constructor.name).toBe('ScanCommand');
    expect(call.args[0].input).toEqual({
      TableName: 'Test',
      ExclusiveStartKey: { item: { S: 'Test' } },
      Limit: 1,
    });
  });
});

describe('query', () => {
  it('should successfully call DynamoDB with QueryCommand', async () => {
    mockDynamoDBClient.on(QueryCommand).resolves({
      Items: [
        {
          AppId: { N: '123' },
          NodeId: { S: 'node1' },
          InstallationId: { N: '456' },
        },
        {
          AppId: { N: '124' },
          NodeId: { S: 'node1' },
          InstallationId: { N: '457' },
        },
      ],
    });

    const queryResult = await tableOperationsTest.query({
      keyConditionExpression: 'NodeId = :nodeId',
      expressionAttributeValues: {
        ':nodeId': { S: 'node1' },
      },
      indexName: 'NodeID',
    });

    expect(queryResult.length).toBe(2);
    expect(queryResult[0]).toEqual({
      AppId: 123,
      NodeId: 'node1',
      InstallationId: 456,
    });
    expect(queryResult[1]).toEqual({
      AppId: 124,
      NodeId: 'node1',
      InstallationId: 457,
    });

    expect(mockDynamoDBClient.commandCalls(QueryCommand)).toHaveLength(1);
    expect(
      mockDynamoDBClient.commandCalls(QueryCommand, {
        TableName: 'Test',
        KeyConditionExpression: 'NodeId = :nodeId',
        ExpressionAttributeValues: {
          ':nodeId': { S: 'node1' },
        },
        IndexName: 'NodeID',
      }),
    ).toHaveLength(1);
  });

  it('should return empty array when no items are found', async () => {
    mockDynamoDBClient.on(QueryCommand).resolves({
      Items: [],
    });

    const queryResult = await tableOperationsTest.query({
      keyConditionExpression: 'NodeId = :nodeId',
      expressionAttributeValues: {
        ':nodeId': { S: 'nonexistent' },
      },
      indexName: 'NodeID',
    });

    expect(queryResult).toEqual([]);
    expect(mockDynamoDBClient.commandCalls(QueryCommand)).toHaveLength(1);
  });

  it('should throw an error if DynamoDB throws an error', async () => {
    mockDynamoDBClient
      .on(QueryCommand)
      .rejects(new Error('DynamoDB service error'));

    await expect(
      tableOperationsTest.query({
        keyConditionExpression: 'NodeId = :nodeId',
        expressionAttributeValues: {
          ':nodeId': { S: 'node1' },
        },
        indexName: 'NodeID',
      }),
    ).rejects.toThrow('Error querying Test: Error: DynamoDB service error');
  });
});
