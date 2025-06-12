import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAppIdsImpl, putInstallationImpl, getInstallationIdsImpl, InstallationRecord } from '../../data';
import { EnvironmentError } from '../../error';
import { getAppTokenImpl } from '../get-app-token/getAppToken';
import { GitHubAPIService } from '../../gitHubService';
import { EnvironmentVariables } from '../constants';

/**
 * Mapping of AppId to all the installations associated with it.
 */
type AppInstallations = {
  [appId: number]: InstallationRecord[]
};

/**
 * Entry handler for Lambda.
 * @param event input events; not currently used as this is executed on a schedule.
 * @returns difference between installations found in DDB and found in GitHub.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const result = await handlerImpl(event);
  return result;
};

/**
 * Implementation of handler to calculate differences between installation instances.
 * @param _event input events; not currently used as this is executed on a schedule.
 * @returns difference between installations found in DDB and found in GitHub.
 */
export const handlerImpl = async (
  _event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {

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
    // Fetch each AppToken for this account.
    const appToken = (await getAppTokenImpl({
      appId: appId,
      tableName: appTableName,
    })).appToken;

    // Using the App identity granted by the AppToken, generate a GitHub client.
    const githubService = new GitHubAPIService({
      appToken: appToken
    });

    // Fetch installations from GitHub and map them to the fields we need.
    const actualInstallations = await githubService.getInstallations({});
    const gitHubInstallations: InstallationRecord[] = await Promise.all(actualInstallations.map((installation) => {
      return {
        installationId: installation.id,
        appId: appId,
        nodeId: installation.account ? installation.account.node_id : "",
      }
    }));

    githubConfirmedInstallations[appId] = gitHubInstallations;
  }));

  // Calculate where GitHub has more installations than we have registed, 
  // or where Dynamo has installations GitHub doesn't know about.
  const { unverifiedInstallations, missingInstallations }: { unverifiedInstallations: InstallationRecord[]; missingInstallations: InstallationRecord[]; }
    = await calculateInstallationDifferences(appIds, githubConfirmedInstallations, registeredInstallations);

  return {
    body: JSON.stringify({ unverifiedInstallations: unverifiedInstallations, missingInstallations: missingInstallations }),
    statusCode: 200,
  };
};

/**
 * Calculate and action on the differences between installations in Dynamo and installations in GitHub.
 * @param appIds a list of all AppIds for this account that could have installations.
 * @param githubConfirmedInstallations a map of all Apps to all installations found in GitHub.
 * @param registeredInstallations a map of all Apps to all installations found in DynamoDB.
 * @returns the list of installations found in only GitHub or only DynamoDB that needs to be reconciled.
 */
const calculateInstallationDifferences = async (
  appIds: number[],
  githubConfirmedInstallations: AppInstallations,
  registeredInstallations: AppInstallations): 
    Promise<{ 
      missingInstallations: InstallationRecord[], 
      unverifiedInstallations: InstallationRecord[] }> => {
        
  const missingInstallations: InstallationRecord[] = [];
  const unverifiedInstallations: InstallationRecord[] = [];

  // Calculate the differences for each AppId.
  await Promise.all(appIds.map(async (appId) => {
    const gitHubInstallationsForAppId = githubConfirmedInstallations[appId] ?? [];
    const registeredInstallationsForAppId = registeredInstallations[appId] ?? [];

    if (gitHubInstallationsForAppId.length > 0) {
      unverifiedInstallations.push(...await getUnverifiedInstallations(gitHubInstallationsForAppId, registeredInstallationsForAppId));
    }

    if (registeredInstallationsForAppId.length > 0) {
      missingInstallations.push(...await getMissingInstallations(registeredInstallationsForAppId, gitHubInstallationsForAppId));
    }
  }));
  return { unverifiedInstallations, missingInstallations };
}

/**
 * Given a list of all GitHub installations and all DynamoDB installations for an AppId,
 * find the ones that are only in DynamoDB.
 * @param registeredInstallationsForAppId a list of all  DynamoDB installations for an AppId
 * @param gitHubInstallationsForAppId a list of all GitHub installations for an AppId
 */
const getMissingInstallations = async (registeredInstallationsForAppId: InstallationRecord[], 
  gitHubInstallationsForAppId: InstallationRecord[], 
  ): Promise<InstallationRecord[]> => {
    const missingInstallations: InstallationRecord[] = [];
    
    registeredInstallationsForAppId.forEach(async (installation) => {
    if (gitHubInstallationsForAppId && gitHubInstallationsForAppId.indexOf(installation) < 0) {
      missingInstallations.push(installation);
    }
  });
  
  return missingInstallations;
}

/**
 * Given a list of all GitHub installations and all DynamoDB installations for an AppId,
 * find the ones that are only in GitHub, and add them to the DynamoDB table.
 * @param gitHubInstallationsForAppId a list of all GitHub installations for an AppId
 * @param registeredInstallationsForAppId a list of all  DynamoDB installations for an AppId
 */
const getUnverifiedInstallations = async (gitHubInstallationsForAppId: InstallationRecord[], 
  registeredInstallationsForAppId: InstallationRecord[]): Promise<InstallationRecord[]> => {

  const unverifiedInstallations: InstallationRecord[] = [];
  const installationTableName = checkEnvironmentImpl().installationTableName;
  await Promise.all(gitHubInstallationsForAppId.map(async (installation) => {
    if (registeredInstallationsForAppId.indexOf(installation) < 0) {
      unverifiedInstallations.push(installation);

      await putInstallationImpl({
        tableName: installationTableName,
        appId: installation.appId,
        nodeId: installation.nodeId,
        installationId: installation.installationId,
      });
    }
  }));

  return unverifiedInstallations;
}

// Miscallaneous environment variable checking functions.
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
      `No value found in ${EnvironmentVariables.APP_TABLE_NAME} environment variable.`,
    );
  }
  const installationTableName = process.env.INSTALLATION_TABLE_NAME;
  if (!installationTableName) {
    throw new EnvironmentError(
      `No value found in ${EnvironmentVariables.INSTALLATION_TABLE_NAME} environment variable.`,
    );
  }
  return { appTableName: appTableName, installationTableName: installationTableName };
};

