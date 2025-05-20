import {
  AttributeValue,
  GetItemCommand,
  GetItemCommandOutput,
  ScanCommand,
  ScanCommandOutput,
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

      console.log(`GetItemCommand: ${JSON.stringify(command)}`)

      const result: GetItemCommandOutput = await client.send(command);

      console.log(`GetItem Result: ${JSON.stringify(result)}`)

      if (!result.Item) {
        throw new NotFound(`Item not found in ${this.config.TableName}`);
      }

      return unmarshall(result.Item);
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      throw new Error(`Error getting item from ${this.config.TableName}: ${error}`);
    }
  }

  /**
   * Retrieves all data within a DynamoDB table.
   * @returns an array of items containing all rows in the table.
   */
  async scan(): Promise<Record<string, AttributeValue>[]> {
    const client = dynamodbClient();
    const command = new ScanCommand({
      TableName: this.config.TableName,
    });

    const result: ScanCommandOutput = await client.send(command);

    if (!result.Items) {
      throw new NotFound(`Items not found in ${this.config.TableName}`);
    }

    return result.Items.map<Record<string, AttributeValue>>((item) => {
      return unmarshall(item);
    });
  }
}
