import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { captureAWSv3Client } from 'aws-xray-sdk';
let ddbClient: DynamoDB;
/**
 Build a cached, X-Ray-instrumented DynamoDB client.
 @param config Client configuration
 @returns DynamoDB client
 */
export const dynamodbClient = (config: DynamoDBClientConfig = {}): DynamoDB => {
  if (!ddbClient) {
    const client = new DynamoDB(config);
    ddbClient = captureAWSv3Client(client);
  }
  return ddbClient;
};
