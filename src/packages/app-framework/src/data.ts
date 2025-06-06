import { DataError } from './error';
import { TableOperations } from './tableOperations';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

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
    console.log(`Creating table operations for name ${tableName}`);
    const getItem = new TableOperations({ TableName: tableName });
    console.log(`Fetching ARN with AppId ${appId.toString()}`);
    const result = await getItem.getItem({
      AppId: { N: appId.toString() },
    });
    console.log(`Successfully fetched ARN ${JSON.stringify(result)}`);
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
}) => Promise<number[]>;

export const getAppIdsImpl: GetAppIds = async (
  tableName,
): Promise<number[]> => {
  const tableOperations = new TableOperations({
    TableName: tableName.tableName,
  });

  const items: Record<string, AttributeValue>[] = await tableOperations.scan();
  console.log(`Items returned from DDB: ${JSON.stringify(items)}`);
  const appIds: number[] = [];
  items.forEach((element, _index, _array) => {
    element
    if (!!element.AppId.N) {
      appIds.push(parseInt(element.AppId.N));
    }
  })
  return appIds;
};

export type GetInstallationIds = ({
  tableName,
}: {
  tableName: string;
}) => Promise<Map<number, number[]>>;

export const getInstallationIdsImpl: GetInstallationIds = async (
  tableName,
): Promise<Map<number, number[]>> => {
  const tableOperations = new TableOperations({
    TableName: tableName.tableName,
  });

  const items: Record<string, AttributeValue>[] = await tableOperations.scan();
  console.log(`Items returned from DDB: ${JSON.stringify(items)}`);
  const installationIds: Map<number, number[]> = new Map();
  items.forEach((element, _index, _array) => {
    element
    if (!!element.AppId.N && !!element.InstallationId.N) {
      const appId = parseInt(element.AppId.N);
      const installationId = parseInt(element.InstallationId.N);

      const existingInstallationIds = installationIds.get(appId) ?? [];
      existingInstallationIds.push(installationId);

      installationIds.set(appId, existingInstallationIds);
    }
  });

  return installationIds;
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
