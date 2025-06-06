import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAppIdsImpl, getInstallationIdsImpl } from '../../data';
import { EnvironmentError } from '../../error';
import { EnvironmentVariables } from '../get-app-token/constants';
import { getAppTokenImpl } from '../get-app-token/getAppToken';
import { GitHubAPIService } from '../../gitHubService';

type AppInstallations = Map<number, number[]>;

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

  const appIds: number[] = await getAppIdsImpl({ tableName: appTableName });
  const installationIds: AppInstallations = await getInstallationIdsImpl({ tableName: installationTableName});

  const githubConfirmedInstallations: AppInstallations = new Map<number, number[]>();

  await Promise.all(appIds.map(async (appId: number) => {
    const appToken = (await getAppTokenImpl({
      appId: appId,
      tableName: appTableName,
    })).appToken;

    const githubService = new GitHubAPIService({
      appToken: appToken
    });

    const actualInstallations = await githubService.getInstallations({ });
    const gitHubInstallationIds: number[] = await Promise.all(actualInstallations.map((installation) => { return installation.id }));

    githubConfirmedInstallations.set(appId, gitHubInstallationIds);
  }));

  console.log(`Found all DynamoDB installations: ${JSON.stringify(Array.from(installationIds.entries()))}`);
  console.log(`Found all GitHub installations: ${JSON.stringify(Array.from(githubConfirmedInstallations.entries()))}`);

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
