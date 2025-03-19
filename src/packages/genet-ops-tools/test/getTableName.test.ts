import {
  GetResourcesCommand,
  ResourceGroupsTaggingAPIClient,
} from '@aws-sdk/client-resource-groups-tagging-api';
import { mockClient } from 'aws-sdk-client-mock';
import { displayDynamoDBTables, listTablesByTags } from '../src/getTableName';

const mockTagClient = mockClient(ResourceGroupsTaggingAPIClient);

describe('listTablesByTags', () => {
  beforeEach(() => {
    mockTagClient.reset();
    jest.resetAllMocks();
  });
  it('should return table names when tables exist', async () => {
    const response = {
      ResourceTagMappingList: [
        { ResourceARN: 'arn:aws:dynamodb:region:account:table/Table1' },
        { ResourceARN: 'arn:aws:dynamodb:region:account:table/Table2' },
        { ResourceARN: 'arn:aws:dynamodb:region:account:table/Table3' },
      ],
    };
    mockTagClient.on(GetResourcesCommand).resolves(response);
    const result = await listTablesByTags();
    expect(result).toEqual(['Table1', 'Table2', 'Table3']);
  });
  it('should handle pagination and return all table names  ', async () => {
    mockTagClient
      .on(GetResourcesCommand)
      .resolvesOnce({
        ResourceTagMappingList: [
          { ResourceARN: 'arn:aws:dynamodb:region:account:table/Table1' },
        ],
        PaginationToken: 'nextPage',
      })
      .resolvesOnce({
        ResourceTagMappingList: [
          { ResourceARN: 'arn:aws:dynamodb:region:account:table/Table2' },
        ],
        PaginationToken: 'nextPage',
      })
      .resolvesOnce({
        ResourceTagMappingList: [
          { ResourceARN: 'arn:aws:dynamodb:region:account:table/Table3' },
        ],
      });
    const result = await listTablesByTags();
    expect(result).toEqual(['Table1', 'Table2', 'Table3']);
    expect(mockTagClient.calls()).toHaveLength(3);
  });
  it('should return empty array when no tables are found', async () => {
    mockTagClient.on(GetResourcesCommand).resolves({
      ResourceTagMappingList: [],
    });
    const result = await listTablesByTags();
    expect(result).toEqual([]);
  });
  it('should throw an error when GetResourceCommand fails', async () => {
    mockTagClient
      .on(GetResourcesCommand)
      .rejects(new Error('Failed to list resources'));
    await expect(listTablesByTags()).rejects.toThrow(
      'Failed to list resources',
    );
  });
});

describe('displayDynamoDBTables', () => {
  let mockListTables = jest.fn();
  const mockConsoleLog = jest.spyOn(console, 'log');
  const mockExit = jest
    .spyOn(process, 'exit')
    .mockImplementation((): never => undefined as never);
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should log table names when tables are found', async () => {
    const mockTables = ['Table1', 'Table2', 'Table3'];
    mockListTables.mockResolvedValue(mockTables);
    await displayDynamoDBTables({
      listTables: mockListTables,
    });
    expect(mockConsoleLog).toHaveBeenNthCalledWith(1, '\nAvailable tables:');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(2, '1. Table1');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(3, '2. Table2');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(4, '3. Table3');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(
      5,
      '\nTotal tables found: 3\n',
    );
  });
  it('should handle empty table list', async () => {
    mockListTables.mockResolvedValue([]);
    await displayDynamoDBTables({
      listTables: mockListTables,
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'No tables found with the specified tags',
    );
  });
  it('should log and error and exit when listTables  fails', async () => {
    mockListTables.mockRejectedValue(
      new Error('Failed to list the tables found'),
    );
    await displayDynamoDBTables({
      listTables: mockListTables,
    });
    expect(mockExit).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
