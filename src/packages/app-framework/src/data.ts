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

export type InstallationRecord = {
  appId: number,
  installationId: number,
  nodeId: string,
};

type AppInstallations = {
  [appId: number]: InstallationRecord[]
};

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
}) => Promise<number[]>;

export const getAppIdsImpl: GetAppIds = async (
  tableName,
): Promise<number[]> => {
  const tableOperations = new TableOperations({
    TableName: tableName.tableName,
  });

  const items: Record<string, AttributeValue>[] = await tableOperations.scan();
  const appIds: number[] = [];
  items.forEach((element, _index, _array) => {
    element
    if (!!element.AppId.N) {
      appIds.push(parseInt(element.AppId.N));
    }
  })
  return appIds;
};

export type GetInstallations = ({
  tableName,
}: {
  tableName: string;
}) => Promise<AppInstallations>;

export const getInstallationIdsImpl: GetInstallations = async (
  tableName,
): Promise<AppInstallations> => {
  const tableOperations = new TableOperations({
    TableName: tableName.tableName,
  });

  const items: Record<string, AttributeValue>[] = await tableOperations.scan();
  const installationIds: AppInstallations = {};
  items.forEach((element, _index, _array) => {
    console.log(`Element: ${JSON.stringify(element)}`);

    if (!!element.AppId.N && !!element.InstallationId.N) {
      const appId = parseInt(element["AppId"].N);
      const installationId = parseInt(element["InstallationId"].N);
      const nodeId = element.NodeId.S;

      const existingInstallationIds = installationIds[appId] ?? [];
      existingInstallationIds.push({ 
        installationId: installationId, 
        appId: appId, 
        nodeId: nodeId ?? "" 
      });

      installationIds[appId] = existingInstallationIds;
    }
  });

  return installationIds;
};

export type PutInstallation = ({
  tableName,
  appId,
  nodeId,
  installationId
}: {
  tableName: string;
  appId: number;
  nodeId: string;
  installationId: number;

}) => Promise<void>;

export const putInstallationImpl: PutInstallation = async ({  
  tableName,
  appId,
  nodeId,
  installationId,
}): Promise<void> => {
  const tableOperations = new TableOperations({
    TableName: tableName,
  });

  const item = {
    TableName: { "S": tableName },
    AppId: { "N": appId.toString() },
    NodeId: { "S": nodeId },
    InstallationId: { "N": installationId.toString() },
  };

  console.log(`Writing ${JSON.stringify(item)} to DynamoDB.`);

  await tableOperations.putItem(item);

  return;
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
