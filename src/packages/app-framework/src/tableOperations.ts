import {
  AttributeValue,
  GetItemCommand,
  GetItemCommandOutput,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
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
  async getItem(query?: Record<string, AttributeValue>) {
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
   * Retrieves all data within a DynamoDB table.
   * @returns an array of items containing all rows in the table.
   */
  async scan(): Promise<Record<string, AttributeValue>[]> {
    const client = dynamodbClient();
    var command = new ScanCommand({
      TableName: this.config.TableName,
    });
    let response = await client.send(command);
    let results: Record<string, any>[] = (response.Items || []).map((item) =>
      unmarshall(item as Record<string, AttributeValue>),
    );
    while (response.LastEvaluatedKey) {
      const ExclusiveStartKey = response.LastEvaluatedKey;
      command = new ScanCommand({
        TableName: this.config.TableName,
        ExclusiveStartKey,
      });
      response = await client.send(command);
      const unmarshalledItems = (response.Items || []).map((item) =>
        unmarshall(item as Record<string, AttributeValue>),
      );
      results = results.concat(unmarshalledItems);
    }
    return results;
    // const client = dynamodbClient();
    // const command = new ScanCommand({
    //   TableName: this.config.TableName,
    // });

    // const result: ScanCommandOutput = await client.send(command);

    // if (!result.Items) {
    //   throw new NotFound(`Items not found in ${this.config.TableName}`);
    // }

    // return result.Items;
  }
}
