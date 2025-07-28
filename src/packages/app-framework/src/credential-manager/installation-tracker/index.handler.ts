import { APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  getAppIdsImpl,
  putInstallationImpl,
  getMappedInstallationIdsImpl,
  InstallationRecord,
  deleteInstallationImpl,
  GetMappedInstallations,
  DeleteInstallation,
  PutInstallation,
  GetAppIds,
} from '../../data';
import { EnvironmentError } from '../../error';
import { GitHubAPIService } from '../../gitHubService';
import { EnvironmentVariables } from '../constants';
import { GetAppToken, getAppTokenImpl } from '../get-app-token/getAppToken';

/**
 * Mapping of AppId to all the installations associated with it.
 */
type AppInstallations = {
  [appId: number]: InstallationRecord[];
};

/**
 * Entry handler for Lambda.
 * @returns difference between installations found in DDB and found in GitHub.
 */
export const handler = async (): Promise<APIGatewayProxyResultV2> => {
  const result = await handlerImpl({});
  console.log('Missing or unverified installations:', JSON.stringify(result));
  return result;
};

export type Handler = ({
  checkEnvironment,
  getAppIds,
  getMappedInstallationIds,
  getAppToken,
  calculateInstallationDifferences,
  putInstallation,
}: {
  checkEnvironment?: CheckEnvironment;
  getAppIds?: GetAppIds;
  getMappedInstallationIds?: GetMappedInstallations;
  getAppToken?: GetAppToken;
  calculateInstallationDifferences?: CalculateInstallationDifferences;
  putInstallation?: PutInstallation;
}) => Promise<APIGatewayProxyResultV2>;
/**
 * Implementation of handler to calculate differences between installation instances.
 * @param checkEnvironment returns table names present in the environment variables
 * @param getAppIds returns a list of App IDs currently stored in the App Table
 * @param getInstallationIds returns a list of installation Ids separated by App ID
 * @param calculateInstallationDifferences returns a list of unverified and missing installations
 * @returns difference between installations found in DDB and found in GitHub.
 */
export const handlerImpl: Handler = async ({
  checkEnvironment = checkEnvironmentImpl,
  getAppIds = getAppIdsImpl,
  getMappedInstallationIds = getMappedInstallationIdsImpl,
  getAppToken = getAppTokenImpl,
  calculateInstallationDifferences = calculateInstallationDifferencesImpl,
  putInstallation = putInstallationImpl,
}) => {
  const envVars = checkEnvironment();
  const appTableName: string = envVars.appTableName;
  const installationTableName: string = envVars.installationTableName;

  // Find all AppIds for this account.
  const appIds: number[] = await getAppIds({ tableName: appTableName });

  // Find all installations for this account, split by AppId.
  // Registered installations are known in DynamoDB.
  const registeredInstallations: AppInstallations =
    await getMappedInstallationIds({
      tableName: installationTableName,
    });
  // GitHub installations are actual installations that GitHub has.
  const githubConfirmedInstallations: AppInstallations = {};

  // Find all installations for this account, according to GitHub.
  await Promise.all(
    appIds.map(async (appId: number) => {
      // Fetch each AppToken for this account.
      const appToken = (
        await getAppToken({
          appId: appId,
          tableName: appTableName,
        })
      ).appToken;

      // Using the App identity granted by the AppToken, generate a GitHub client.
      const githubService = new GitHubAPIService({
        token: appToken,
      });

      // Fetch installations from GitHub and map them to the fields we need.
      const actualInstallations = await githubService.getInstallations({});
      const gitHubInstallations: InstallationRecord[] = await Promise.all(
        actualInstallations.map((installation) => {
          return {
            installationId: installation.id,
            appId: appId,
            nodeId: installation.account ? installation.account.node_id : '',
          };
        }),
      );

      githubConfirmedInstallations[appId] = gitHubInstallations;
      // Update last refreshed timestamp to all items.
      await Promise.all(
        gitHubInstallations.map(async (installation) => {
          await putInstallation({
            tableName: installationTableName,
            ...installation,
            lastRefreshed: new Date().toISOString(),
          });
        }),
      );
    }),
  );

  // Calculate where GitHub has more installations than we have registered,
  // or where Dynamo has installations GitHub doesn't know about.
  const {
    unverifiedInstallations,
    missingInstallations,
  }: {
    unverifiedInstallations: InstallationRecord[];
    missingInstallations: InstallationRecord[];
  } = await calculateInstallationDifferences({
    appIds,
    githubConfirmedInstallations,
    registeredInstallations,
  });

  return {
    body: JSON.stringify({
      unverifiedInstallations: unverifiedInstallations,
      missingInstallations: missingInstallations,
    }),
    statusCode: 200,
  };
};

/**
 * Calculate and action on the differences between installations in Dynamo and installations in GitHub.
 * @param appIds a list of all AppIds for this account that could have installations.
 * @param githubConfirmedInstallations a map of all Apps to all installations found in GitHub.
 * @param registeredInstallations a map of all Apps to all installations found in DynamoDB.
 * @param getUnverifiedInstallations a method to get all installations on GitHub but not recorded in the DynamoDB table
 * @param getMissingInstallations a method to get all installations missing in GitHub, but recorded in the DynamoDB table
 * @returns the list of installations found in only GitHub or only DynamoDB that needs to be reconciled.
 */

export type CalculateInstallationDifferences = ({
  appIds,
  githubConfirmedInstallations,
  registeredInstallations,
  getUnverifiedInstallations,
  getMissingInstallations,
}: {
  appIds: number[];
  githubConfirmedInstallations: AppInstallations;
  registeredInstallations: AppInstallations;
  getUnverifiedInstallations?: GetUnverifiedInstallations;
  getMissingInstallations?: GetMissingInstallations;
}) => Promise<{
  missingInstallations: InstallationRecord[];
  unverifiedInstallations: InstallationRecord[];
}>;
export const calculateInstallationDifferencesImpl: CalculateInstallationDifferences =
  async ({
    appIds,
    githubConfirmedInstallations,
    registeredInstallations,
    getUnverifiedInstallations = getUnverifiedInstallationsImpl,
    getMissingInstallations = getMissingInstallationsImpl,
  }) => {
    const missingInstallations: InstallationRecord[] = [];
    const unverifiedInstallations: InstallationRecord[] = [];

    // Calculate the differences for each AppId.
    await Promise.all(
      appIds.map(async (appId) => {
        const gitHubInstallationsForAppId =
          githubConfirmedInstallations[appId] ?? [];
        const registeredInstallationsForAppId =
          registeredInstallations[appId] ?? [];

        if (gitHubInstallationsForAppId.length > 0) {
          unverifiedInstallations.push(
            ...(await getUnverifiedInstallations({
              gitHubInstallationsForAppId,
              registeredInstallationsForAppId,
            })),
          );
        }

        if (registeredInstallationsForAppId.length > 0) {
          missingInstallations.push(
            ...(await getMissingInstallations({
              registeredInstallationsForAppId,
              gitHubInstallationsForAppId,
            })),
          );
        }
      }),
    );
    return { unverifiedInstallations, missingInstallations };
  };

/**
 * Given a list of all GitHub installations and all DynamoDB installations for an AppId,
 * find the ones that are only in DynamoDB.
 * @param registeredInstallationsForAppId a list of all  DynamoDB installations for an AppId
 * @param gitHubInstallationsForAppId a list of all GitHub installations for an AppId
 * @param checkEnvironment returns table names present in the environment variables
 * @param deleteInstallation method to delete installations from the installations table
 */

export type GetMissingInstallations = ({
  registeredInstallationsForAppId,
  gitHubInstallationsForAppId,
  checkEnvironment,
  deleteInstallation,
}: {
  registeredInstallationsForAppId: InstallationRecord[];
  gitHubInstallationsForAppId: InstallationRecord[];
  checkEnvironment?: CheckEnvironment;
  deleteInstallation?: DeleteInstallation;
}) => Promise<InstallationRecord[]>;
export const getMissingInstallationsImpl: GetMissingInstallations = async ({
  registeredInstallationsForAppId,
  gitHubInstallationsForAppId,
  checkEnvironment = checkEnvironmentImpl,
  deleteInstallation = deleteInstallationImpl,
}) => {
  const installationTableName = checkEnvironment().installationTableName;
  const missingInstallations = leftJoinInstallationsForOneApp(
    registeredInstallationsForAppId,
    gitHubInstallationsForAppId,
  );
  await Promise.all(
    missingInstallations.map(async (installation) => {
      await deleteInstallation({
        tableName: installationTableName,
        nodeId: installation.nodeId,
        appId: installation.appId,
      });
    }),
  );

  return missingInstallations;
};

/**
 * Given a list of all GitHub installations and all DynamoDB installations for an AppId,
 * find the ones that are only in GitHub, and add them to the DynamoDB table.
 * @param gitHubInstallationsForAppId a list of all GitHub installations for an AppId
 * @param registeredInstallationsForAppId a list of all  DynamoDB installations for an AppId
 * @param checkEnvironment returns table names present in the environment variables
 * @param putInstallation method to put new installations from the installations table
 */

export type GetUnverifiedInstallations = ({
  registeredInstallationsForAppId,
  gitHubInstallationsForAppId,
  checkEnvironment,
  putInstallation,
  lastRefreshed,
}: {
  registeredInstallationsForAppId: InstallationRecord[];
  gitHubInstallationsForAppId: InstallationRecord[];
  checkEnvironment?: CheckEnvironment;
  putInstallation?: PutInstallation;
  lastRefreshed?: string;
}) => Promise<InstallationRecord[]>;
export const getUnverifiedInstallationsImpl: GetUnverifiedInstallations =
  async ({
    gitHubInstallationsForAppId,
    registeredInstallationsForAppId,
    checkEnvironment = checkEnvironmentImpl,
    putInstallation = putInstallationImpl,
  }): Promise<InstallationRecord[]> => {
    const installationTableName = checkEnvironment().installationTableName;

    const unverifiedInstallations = leftJoinInstallationsForOneApp(
      gitHubInstallationsForAppId,
      registeredInstallationsForAppId,
    );

    await Promise.all(
      unverifiedInstallations.map(async (installation) => {
        await putInstallation({
          tableName: installationTableName,
          ...installation,
          lastRefreshed: new Date().toISOString(),
        });
      }),
    );

    return unverifiedInstallations;
  };

/**
 * Give me the installation records in left that are not in right.
 *
 * @param left
 * @param right
 */
export const leftJoinInstallationsForOneApp = (
  left: InstallationRecord[],
  right: InstallationRecord[],
): InstallationRecord[] => {
  // we know that all installations are for a single app id
  // we know that all installation ids are unique
  const rightInstallationIds = right.map(
    (installation) => installation.installationId,
  );

  return left.filter((installation) => {
    return !rightInstallationIds.includes(installation.installationId);
  });
};

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
  return {
    appTableName: appTableName,
    installationTableName: installationTableName,
  };
};
