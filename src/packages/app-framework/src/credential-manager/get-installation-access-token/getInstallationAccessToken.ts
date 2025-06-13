import { GetInstallationTokenOutput } from '@framework.api/app-framework-ssdk';
import {
  GetInstallationIdFromTable,
  getInstallationIdFromTableImpl,
} from '../../data';
import { NotFound } from '../../error';
import { GitHubAPIService } from '../../gitHubService';
import { GetAppToken, getAppTokenImpl } from '../get-app-token/getAppToken';

export type GetInstallationAccessToken = ({
  appId,
  nodeId,
  installationTable,
  appTable,
  getAppToken,
  getInstallationId,
}: {
  appId: number;
  nodeId: string;
  installationTable: string;
  appTable: string;
  getAppToken?: GetAppToken;
  getInstallationId?: GetInstallationId;
}) => Promise<GetInstallationTokenOutput>;

/**
 *  Retrieves Installation Access token from GitHub APIs.
 *
 ---
 @param appId ID of the GitHub App expected in the response.
 @param nodeId ID of the target the GitHub App is installed in.
 @param installationTable DynamoDB Table that contains installation id mapping to App ID and Node ID
 @param appTable DynamoDB Table that contains app-to-key mappings
 @param getAppToken Function that retrieves the App token
 @param getInstallationId Function that retrieves the installation ID from either Installations DynamoDB Table
  or GitHub APIs
 @param getInstallationAccessTokenFromGitHub Function that retrieves Installation Access token from GitHub API
 @returns An Installation Access Token with App ID, Node ID and Expiration time
 */

export const getInstallationAccessTokenImpl: GetInstallationAccessToken =
  async ({
    appId,
    nodeId,
    appTable,
    installationTable,
    getAppToken = getAppTokenImpl,
    getInstallationId = getInstallationIdImpl,
  }): Promise<GetInstallationTokenOutput> => {
    try {
      console.log('App ID: ', appId);
      console.log('Node ID: ', nodeId);
      const appToken = await getAppToken({
        appId: appId,
        tableName: appTable,
      });
      const installationID = await getInstallationId({
        appId: appId,
        nodeId: nodeId,
        installationTable: installationTable,
        appToken: appToken.appToken,
      });
      const githubService = new GitHubAPIService({
        appToken: appToken.appToken,
      });
      const installationAccessToken = await githubService.getInstallationToken({
        installationId: installationID,
      });
      return {
        appId: appId,
        nodeId: nodeId,
        installationToken: installationAccessToken.token,
        expirationTime: new Date(installationAccessToken.expires_at),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

export interface GetInstallationId {
  ({
    appId,
    nodeId,
    installationTable,
    getInstallationIdFromTable,
    appToken,
  }: {
    appId: number;
    nodeId: string;
    getInstallationIdFromTable?: GetInstallationIdFromTable;
    installationTable: string;
    appToken: string;
  }): Promise<number>;
}

/**
 *  Retrieves Installation ID from DynamoDB Table,
 *  but if unable to retrieve from the DynamoDB Table it is retrieved from GitHub APIs.
 *
 ---
 @param appId ID of the GitHub App expected in the response.
 @param nodeId ID of the target the GitHub App is installed in.
 @param installationTable DynamoDB Table that contains installation id mapping to App ID and Node ID
 @param getInstallationIdFromTable Function that retrieves Installation from Installations DynamoDB Table
 @param appToken Token necessary for calling GitHub API to retrieve Installation ID
 @returns An Installation ID
 @throws DataError Incase GitHub API response does not have installation ID
 */

export const getInstallationIdImpl: GetInstallationId = async ({
  appId,
  nodeId,
  installationTable,
  getInstallationIdFromTable = getInstallationIdFromTableImpl,
  appToken,
}): Promise<number> => {
  console.log(`Received inputs to get installationID: 
    { appId: ${appId}, nodeId: ${nodeId}}`);
  try {
    const installationID = await getInstallationIdFromTable({
      appId,
      nodeId,
      tableName: installationTable,
    });
    console.log('Sucessfully read from table');
    return installationID;
  } catch (error) {
    console.log('Unable to read from table trying to read from GitHub API...');
    const githubService = new GitHubAPIService({ appToken });
    const result = await githubService.getInstallations({});
    let installationID = -1;

    if (!!result) {
      result.map((appInstallation) => {
        if (
          appInstallation.app_id === appId &&
          appInstallation.account!.node_id === nodeId
        ) {
          installationID = appInstallation.id;
        }
      });
    }

    if (installationID === -1) {
      console.log('Response from GitHub:', JSON.stringify(result));
      throw new NotFound(
        `Installation not found in response for app Id: ${appId} and target: ${nodeId}`,
      );
    }

    return installationID;
  }
};
