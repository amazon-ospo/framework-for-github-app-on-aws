import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAppIdsImpl, putInstallationImpl, getInstallationIdsImpl, InstallationRecord } from '../../data';
import { EnvironmentError } from '../../error';
import { getAppTokenImpl } from '../get-app-token/getAppToken';
import { GitHubAPIService } from '../../gitHubService';
import { InstallationAccessTokenEnvironmentVariables } from '../get-installation-access-token/constants';

type AppInstallations = {
  [appId: number]: InstallationRecord[]
};

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const result = await handlerImpl(event);

  console.log("Completed Impl handler.");

  const parseResponse = JSON.parse(JSON.stringify(result));
  const bodyData = JSON.parse(parseResponse.body);

  console.log("Completed parsing response.");

  const logResponse = {
    unverifiedInstallations: bodyData.unverifiedInstallations,
    missingInstallations: bodyData.missingInstallations,
  };

  console.log(`Response to be returned: ${JSON.stringify(logResponse)}`);
  return result;
};

export const handlerImpl = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  console.log(`Event occurred. event: ${JSON.stringify(event)}`);

  const envVars = checkEnvironmentImpl();
  const appTableName: string = envVars.appTableName;
  const installationTableName: string = envVars.installationTableName;

  // Find all AppIds for this account.
  const appIds: number[] = await getAppIdsImpl({ tableName: appTableName });
  
  // Find all installations for this account, split by AppId. 
  // Registered installations are known in DynamoDB.
  const registeredInstallations: AppInstallations = await getInstallationIdsImpl({ tableName: installationTableName });
  // GitHub installations are actual installations that GitHub has.
  const githubConfirmedInstallations: AppInstallations = {};

  // Find all installations for this account, according to GitHub.
  await Promise.all(appIds.map(async (appId: number) => {
    const appToken = (await getAppTokenImpl({
      appId: appId,
      tableName: appTableName,
    })).appToken;

    const githubService = new GitHubAPIService({
      appToken: appToken
    });

    const actualInstallations = await githubService.getInstallations({});
    const gitHubInstallations: InstallationRecord[] = await Promise.all(actualInstallations.map((installation) => { return {
      installationId: installation.id,
      appId: appId,
      nodeId: installation.account ? installation.account.node_id : "",
    }}));

    githubConfirmedInstallations[appId] = gitHubInstallations;
  }));

  console.log(`Found all DynamoDB installations: ${JSON.stringify(registeredInstallations)}`);
  console.log(`Found all GitHub installations: ${JSON.stringify(githubConfirmedInstallations)}`);

  // Calculate the differences for each AppId.
  await Promise.all(appIds.map(async (appId) => {
    // Calculate missing installations.
    const missingInstallations: InstallationRecord[] = [];
    const unverifiedInstallations: InstallationRecord[] = [];

    const gitHubInstallationsForAppId = githubConfirmedInstallations[appId];
    const registeredInstallationsForAppId = registeredInstallations[appId];

    if (!!gitHubInstallationsForAppId) {
      gitHubInstallationsForAppId.forEach((installation) => {
        if (registeredInstallationsForAppId && registeredInstallationsForAppId.indexOf(installation) < 0) {
          unverifiedInstallations.push(installation);
        }
      });
    }

    if (!!registeredInstallationsForAppId) {
      await Promise.all(registeredInstallationsForAppId.map(async (installation) => {
        if (gitHubInstallationsForAppId && gitHubInstallationsForAppId.indexOf(installation) < 0) {
          missingInstallations.push(installation);
          await putInstallationImpl({ 
            tableName: installationTableName, 
            appId: installation.appId,
            nodeId: installation.nodeId,
            installationId: installation.installationId,
          });
        }
      }));
    }
  }));

  return {
    body: JSON.stringify({ unverifiedInstallations: [], missingInstallations: [] }),
    statusCode: 200,
  };
};

export type CheckEnvironment = () => {
  appTableName: string;
  installationTableName: string;
};
/**
 * Verifies that required environment variables are set and attempts to App table name,
 * throws a EnvironmentError if the environment is not correctly configured.
 */
export const checkEnvironmentImpl: CheckEnvironment = () => {
  const appTableName = process.env.APP_TABLE_NAME;
  if (!appTableName) {
    throw new EnvironmentError(
      `No value found in ${InstallationAccessTokenEnvironmentVariables.APP_TABLE_NAME} environment variable.`,
    );
  }
  const installationTableName = process.env.INSTALLATIONS_TABLE_NAME;
  if (!installationTableName) {
    throw new EnvironmentError(
      `No value found in ${InstallationAccessTokenEnvironmentVariables.INSTALLATIONS_TABLE_NAME} environment variable.`,
    );
  }
  return { appTableName: appTableName, installationTableName: installationTableName };
};
