import {
  AttributeValue,
  DeleteItemCommand,
  GetItemCommand,
  GetItemCommandOutput,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb/dist-types/models';
import { dynamodbClient } from './client';
import { NotFound } from './error';

/**
 * Interface representing the required information for creating a DynamoDB calling class.
 * @field TableName - The name of the DynamoDB table to call.
 */
export interface TableOperationsInput {
  readonly TableName: string;
}

/**
 * Operations that call DynamoDB.
 */
export class TableOperations {
  private readonly config: TableOperationsInput;

  /**
   * Creates the class that calls DynamoDB.
   * @param input provided configuration required to construct the class.
   */
  constructor(input: TableOperationsInput) {
    this.config = input;
  }

  /**
   * Retrieves a single row from DynamoDB.
   * @param query the query used to retrieve the row.
   * @returns the row that is returned, or throws an error if no rows are found, or the call fails.
   */
  async getItem(
    query?: Record<string, AttributeValue>,
  ): Promise<Record<string, NativeAttributeValue>> {
    const client = dynamodbClient();
    try {
      const command = new GetItemCommand({
        TableName: this.config.TableName,
        Key: query,
      });

      const result: GetItemCommandOutput = await client.send(command);

      if (!result.Item) {
        console.error(`Item not found in ${this.config.TableName}`);
        throw new NotFound('Item not found');
      }

      return unmarshall(result.Item);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      if (error instanceof NotFound) {
        throw error;
      }
      throw new Error(
        `Error getting item from ${this.config.TableName}: ${error}`,
      );
    }
  }

  /**
   * Writes an item to DynamoDB.
   * @param item the item to write to this table.
   */
  async putItem(item: Record<string, AttributeValue>) {
    const client = dynamodbClient();
    try {
      const command = new PutItemCommand({
        TableName: this.config.TableName,
        Item: item,
      });

      await client.send(command);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      throw new Error(
        `Error putting item in ${this.config.TableName}: ${error}`,
      );
    }
  }

  /**
   * Deletes an item from DynamoDB.
   * @param item the item to delete from this table.
   */
  async deleteItem(key: Record<string, AttributeValue>) {
    const client = dynamodbClient();
    try {
      const command = new DeleteItemCommand({
        TableName: this.config.TableName,
        Key: key,
      });

      await client.send(command);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      throw new Error(
        `Error deleting item in ${this.config.TableName}: ${error}`,
      );
    }
  }

  /**
   * Queries data from a DynamoDB table or GSI.
   * @param keyConditionExpression the key condition expression for the query.
   * @param expressionAttributeValues the values for the expression attributes.
   * @param indexName optional GSI name to query against.
   * @returns an array of items matching the query.
   */
  async query({
    keyConditionExpression,
    expressionAttributeValues,
    indexName,
  }: {
    keyConditionExpression: string;
    expressionAttributeValues: Record<string, AttributeValue>;
    indexName?: string;
  }): Promise<Record<string, NativeAttributeValue>[]> {
    const client = dynamodbClient();
    try {
      const command = new QueryCommand({
        TableName: this.config.TableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        IndexName: indexName,
      });

      const response = await client.send(command);
      return (response.Items || []).map((item) => unmarshall(item));
    } catch (error) {
      console.error(`ERROR: ${error}`);
      throw new Error(`Error querying ${this.config.TableName}: ${error}`);
    }
  }

  /**
   * Retrieves all data within a DynamoDB table.
   * @returns an array of items containing all rows in the table.
   */
  async scan(): Promise<Record<string, NativeAttributeValue>[]> {
    const client = dynamodbClient();
    var command = new ScanCommand({
      TableName: this.config.TableName,
    });
    let response = await client.send(command);
    let results: Record<string, any>[] = (response.Items || []).map((item) =>
      unmarshall(item),
    );
    while (response.LastEvaluatedKey) {
      const ExclusiveStartKey = response.LastEvaluatedKey;
      command = new ScanCommand({
        TableName: this.config.TableName,
        ExclusiveStartKey,
      });
      response = await client.send(command);
      const unmarshalledItems = (response.Items || []).map((item) =>
        unmarshall(item),
      );
      results = results.concat(unmarshalledItems);
    }
    return results;
  }

  /**
   * Retrieves data for a DynamoDB table from a page
   * @returns an array of items with a LastEvaluatedKey.
   */
  async paginated_scan({
    ExclusiveStartKey,
    Limit,
  }: {
    ExclusiveStartKey?: string | undefined;
    Limit?: number | undefined;
  }) {
    const client = dynamodbClient();
    var command = {
      TableName: this.config.TableName,
    };
    var commandInput = command;
    if (!!ExclusiveStartKey) {
      const decodedExclusiveStartKey: Record<string, AttributeValue> =
        JSON.parse(atob(ExclusiveStartKey));
      const newCommand = {
        ...commandInput,
        ExclusiveStartKey: decodedExclusiveStartKey,
      };
      commandInput = newCommand;
    }
    if (!!Limit) {
      const newCommand = {
        ...commandInput,
        Limit,
      };
      commandInput = newCommand;
    }
    const scanCommand = new ScanCommand({ ...commandInput });
    let response = await client.send(scanCommand);
    let LastEvaluatedKey = undefined;
    if (!!response.LastEvaluatedKey) {
      LastEvaluatedKey = btoa(JSON.stringify(response.LastEvaluatedKey));
    }
    let results: Record<string, any>[] = (response.Items || []).map((item) =>
      unmarshall(item),
    );
    return { LastEvaluatedKey, items: results };
  }
}
