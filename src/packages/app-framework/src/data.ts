import { DataError } from './error';
import { TableOperations } from './tableOperations';

export type GetAppKeyArnById = ({
  appId,
  tableName,
}: {
  appId: number;
  tableName: string;
}) => Promise<string>;

export type InstallationRecord = {
  appId: number;
  installationId: number;
  nodeId: string;
};

type AppInstallations = {
  [appId: number]: InstallationRecord[];
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

/**
 * Fetches all AppIds from the Apps DynamoDB table.
 * @param tableName the name of the App table.
 * @returns all the numerical AppIds in the DynamoDB table.
 */
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

  const items = await tableOperations.scan();
  const appIds: number[] = [];
  items.map((element) => {
    appIds.push(element.AppId);
  });
  return appIds;
};

/**
 * Fetches all Installations mapped to AppID from the DynamoDB installations table.
 * @param tableName
 * @returns the mapping of AppId to their respective installations.
 */
export type GetMappedInstallations = ({
  tableName,
}: {
  tableName: string;
}) => Promise<AppInstallations>;

export const getMappedInstallationIdsImpl: GetMappedInstallations = async (
  tableName,
): Promise<AppInstallations> => {
  const items = await getInstallationsImpl(tableName);
  const installationIds: AppInstallations = {};
  items.map((installation) => {
    const appId: number = installation.appId;

    const existingInstallationIds = installationIds[appId] ?? [];
    existingInstallationIds.push(installation);
    installationIds[appId] = existingInstallationIds;
  });

  return installationIds;
};

/**
 * Writes an installation into the DynamoDB table.
 * @param tableName the name of the installation table.
 * @param appId the AppId of the app that has been installed.
 * @param nodeId the NodeId showing where the installation was installed.
 * @param installationId the ID of the installation.
 */
export type PutInstallation = ({
  tableName,
  appId,
  nodeId,
  installationId,
  lastRefreshed,
}: {
  tableName: string;
  appId: number;
  nodeId: string;
  installationId: number;
  lastRefreshed?: string;
}) => Promise<void>;

export const putInstallationImpl: PutInstallation = async ({
  tableName,
  appId,
  nodeId,
  installationId,
  lastRefreshed,
}): Promise<void> => {
  const tableOperations = new TableOperations({
    TableName: tableName,
  });

  const item = {
    AppId: { N: appId.toString() },
    NodeId: { S: nodeId },
    InstallationId: { N: installationId.toString() },
    LastRefreshed: { S: lastRefreshed || '' },
  };

  await tableOperations.putItem(item);

  return;
};

/**
 * Deletes an installation from the DynamoDB table.
 * @param tableName the name of the installation table.
 * @param installationId the ID of the installation.
 */
export type DeleteInstallation = ({
  tableName,
  appId,
  nodeId,
}: {
  tableName: string;
  appId: number;
  nodeId: string;
}) => Promise<void>;

export const deleteInstallationImpl: DeleteInstallation = async ({
  tableName,
  appId,
  nodeId,
}): Promise<void> => {
  const tableOperations = new TableOperations({
    TableName: tableName,
  });

  const key = {
    AppId: { N: appId.toString() },
    NodeId: { S: nodeId },
  };

  await tableOperations.deleteItem(key);

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

export type GetInstallations = ({
  tableName,
}: {
  tableName: string;
}) => Promise<InstallationRecord[]>;

/**
 * Fetches all Installations from the DynamoDB installations table.
 * @param tableName
 * @returns a list of installations currently in the DynamoDB table.
 */
export const getInstallationsImpl: GetInstallations = async ({ tableName }) => {
  const getInstallations = new TableOperations({ TableName: tableName });
  const result: InstallationRecord[] = [];
  const itemList = await getInstallations.scan();
  itemList.map((item) => {
    const appId: number = item.AppId;
    const installationId: number = item.InstallationId;
    const nodeId: string = item.NodeId ?? '';
    result.push({
      appId,
      nodeId,
      installationId,
    });
  });
  return result;
};
