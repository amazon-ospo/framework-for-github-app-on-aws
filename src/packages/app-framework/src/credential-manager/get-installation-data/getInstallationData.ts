import { GetInstallationDataOutput } from '@aws/app-framework-for-github-apps-on-aws-ssdk';
import {
  getInstallationsDataByNodeId as getInstallationsDataByNodeIdImpl,
  GetInstallationsByNodeId,
} from '../../data';
import { NotFound, ServerError } from '../../error';

export type GetInstallationsData = ({
  nodeId,
  installationTable,
  getInstallationsDataByNodeId,
}: {
  nodeId: string;
  installationTable: string;
  getInstallationsDataByNodeId?: GetInstallationsByNodeId;
}) => Promise<GetInstallationDataOutput>;

/**
 * Retrieves installation data from DynamoDB for a given nodeId.
 * @param nodeId ID of the target the GitHub App is installed in
 * @param installationTable DynamoDB Table that contains installation data mapping to App ID and Node ID
 * @param getInstallationsDataByNodeId Function that retrieves installation data from DynamoDB
 * @returns Installation data containing all installations for the specified nodeId
 * @throws NotFound if no installation data is found for the nodeId
 * @throws ServerError for any other errors during retrieval
 */

export const getInstallationsDataImpl: GetInstallationsData = async ({
  nodeId,
  installationTable,
  getInstallationsDataByNodeId = getInstallationsDataByNodeIdImpl,
}): Promise<GetInstallationDataOutput> => {
  try {
    console.log('Node ID: ', nodeId);
    const installationData = await getInstallationsDataByNodeId({
      nodeId,
      tableName: installationTable,
    });
    return { installations: installationData };
  } catch (error) {
    if (error instanceof NotFound) {
      throw error;
    }
    // For any other error, throw as ServerError
    throw new ServerError(
      `Server error while retrieving installation data for target: ${nodeId}`,
    );
  }
};
