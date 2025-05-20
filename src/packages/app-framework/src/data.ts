import { DataError } from './error';
import { TableOperations } from './tableOperations';

export type GetAppKeyArnById = ({
  appId,
  tableName,
}: {
  appId: number;
  tableName: string;
}) => Promise<string>;
/**
 * Retrieves the AWS KMS Key ARN associated with a given GitHub App ID from DynamoDB.
 *
---
 @param appId ID of the GitHub App whose KMS Key ARN is being retrieved.
 @param tableName Name of the App table containing app-to-key mappings.
 @returns The KMS Key ARN as a string.
 @throws NotFound if the app ID does not exist in the table.
 @throws DataError if the record is missing the KmsKeyArn field.
*/
export const getAppKeyArnByIdImpl: GetAppKeyArnById = async ({
  appId,
  tableName,
}) => {
  try {
    const getItem = new TableOperations({ TableName: tableName });
    const result = await getItem.getItem({
      AppId: { N: appId.toString() },
    });
    if (!result.KmsKeyArn) {
      throw new DataError(
        `Invalid data: Missing KmsKeyArn for appId: ${appId}`,
      );
    }
    return result.KmsKeyArn;
  } catch (error) {
    console.error('Error fetching KMS ARN:', error);
    throw error;
  }
};

export type GetAppIds = ({
  tableName,
}: {
  tableName: string;
}) => Promise<string[]>;

export const getAppIdsImpl: GetAppIds = async (
  tableName,
): Promise<string[]> => {
  const tableOperations = new TableOperations({
    TableName: tableName.tableName,
  });
  const items = await tableOperations.scan();
  console.log(`Fetched items from the table: ${JSON.stringify(items)}.`);
  return Array.from(items).map<string>((item) => {
    return item.AppId.toString();
  });
};

/**
 * Retrieves the Installation ID associated with a given GitHub App ID and Node ID from DynamoDB.
 *
 ---
 @param appId ID of the GitHub App whose Installation ID is being retrieved.
 @param nodeId ID of the GitHub App whose Installation ID is being retrieved.
 @param tableName Name of the Installations table containing App and Node ID to Installation ID mapping.
 @param clientBuilder Function to provide DynamoDB client.
 @returns The Installation ID as a number.
 @throws NotFound if the app ID or node ID does not exist in the table.
 @throws DataError if the record is missing the Installation ID field.
 */

export type GetInstallationIdFromTable = ({
  appId,
  nodeId,
  tableName,
}: {
  appId: number;
  nodeId: string;
  tableName: string;
}) => Promise<number>;

export const getInstallationIdFromTableImpl: GetInstallationIdFromTable =
  async ({ appId, nodeId, tableName }) => {
    try {
      const getItem = new TableOperations({ TableName: tableName });
      const result = await getItem.getItem({
        AppId: { N: appId.toString() },
        NodeId: { S: nodeId as string },
      });
      if (!result.InstallationID) {
        throw new DataError(
          `Invalid data: Missing Installation ID for appId: ${appId} and nodeID: ${nodeId}`,
        );
      }
      return result.InstallationID;
    } catch (error) {
      console.error('Error fetching Installation ID:', error);
      throw error;
    }
  };
