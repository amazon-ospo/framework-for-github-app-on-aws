import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamodbClient } from './credential-manager/get-app-token/client';
import { DataError, NotFound } from './error';
export type GetAppKeyArnById = ({
  appId,
  tableName,
  clientBuilder,
}: {
  appId: number;
  tableName: string;
  clientBuilder?: () => DynamoDBClient;
}) => Promise<string>;
/**
 * Retrieves the AWS KMS Key ARN associated with a given GitHub App ID from DynamoDB.
 *
---
 @param appId ID of the GitHub App whose KMS Key ARN is being retrieved.
 @param tableName Name of the App table containing app-to-key mappings.
 @param clientBuilder Function to provide DynamoDB client.
 @returns The KMS Key ARN as a string.
 @throws NotFound if the app ID does not exist in the table.
 @throws DataError if the record is missing the KmsKeyArn field.
*/
export const getAppKeyArnByIdImpl: GetAppKeyArnById = async ({
  appId,
  tableName,
  clientBuilder = dynamodbClient,
}) => {
  const client = clientBuilder();
  try {
    const command = new GetItemCommand({
      TableName: tableName,
      Key: {
        AppId: { N: appId.toString() },
      },
    });
    const result: GetItemCommandOutput = await client.send(command);
    if (!result.Item) {
      throw new NotFound(`KMS ARN not found for the given appId: ${appId}`);
    }
    const record = unmarshall(result.Item);
    if (!record.KmsKeyArn) {
      throw new DataError(
        `Invalid data: Missing KmsKeyArn for appId: ${appId}`,
      );
    }
    return record.KmsKeyArn;
  } catch (error) {
    console.error('Error fetching KMS ARN:', error);
    throw error;
  }
};
