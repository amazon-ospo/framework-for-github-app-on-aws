import {
  AttributeValue,
  GetItemCommand,
  GetItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamodbClient } from './client';
import { NotFound } from './error';
export interface TableOperationsInput {
  readonly TableName: string;
}
export class TableOperations {
  private readonly config: TableOperationsInput;

  constructor(input: TableOperationsInput) {
    this.config = input;
  }

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
      if (error instanceof NotFound) {
        throw error;
      }
      throw new Error(`Error getting item from ${this.config.TableName}`);
    }
  }
}
