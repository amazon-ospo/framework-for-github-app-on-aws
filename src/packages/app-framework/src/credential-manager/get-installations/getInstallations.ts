import { GetInstallationsOutput } from '@aws/app-framework-for-github-apps-on-aws-ssdk';
import {
  getPaginatedInstallationsImpl,
  GetPaginatedInstallations,
} from '../../data';
import { NotFound, ServerError } from '../../error';

export type GetInstallations = ({
  installationTable,
  ExclusiveStartKey,
  Limit,
  getInstallations,
}: {
  installationTable: string;
  ExclusiveStartKey?: string | undefined;
  Limit?: number | undefined;
  getInstallations?: GetPaginatedInstallations;
}) => Promise<GetInstallationsOutput>;

/**
 * Retrieves installation data from DynamoDB.
 * @param installationTable DynamoDB Table that contains installation data mapping to App ID and Node ID
 * @param getInstallations Function that retrieves installation data from DynamoDB
 * @returns Installation data containing all installations
 * @throws NotFound if no installation data is found for the nodeId
 * @throws ServerError for any other errors during retrieval
 */

export const getInstallationRecordsImpl: GetInstallations = async ({
  installationTable,
  ExclusiveStartKey,
  Limit,
  getInstallations = getPaginatedInstallationsImpl,
}): Promise<GetInstallationsOutput> => {
  try {
    const installationData = await getInstallations({
      tableName: installationTable,
      ExclusiveStartKey,
      Limit,
    });
    return {
      installations: installationData.installations,
      nextToken: installationData.LastEvaluatedKey,
    };
  } catch (error) {
    if (error instanceof NotFound) {
      throw error;
    }
    // For any other error, throw as ServerError
    throw new ServerError('Server error while retrieving installations');
  }
};
