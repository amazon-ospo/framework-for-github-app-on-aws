import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAppIdsImpl } from '../../data';
import { EnvironmentError } from '../../error';
import { EnvironmentVariables } from '../get-app-token/constants';
import { getAppTokenImpl } from '../get-app-token/getAppToken';
import { GitHubAPIService } from '../../gitHubService';
// import { TableOperations } from '../../tableOperations';

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  console.log('Entered function');
  const result = await handlerImpl(event);

  const parseResponse = JSON.parse(JSON.stringify(result));
  const bodyData = JSON.parse(parseResponse.body);

  const logResponse = {
    unverifiedInstallations: bodyData.unverifiedInstallations,
    missingInstallations: bodyData.missingInstallations,
  };

  console.log(JSON.stringify(logResponse));
  return result;
};

export const handlerImpl = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  console.log(`Event occurred. event: ${JSON.stringify(event)}`);

  const tableName: string = checkEnvironmentImpl().tableName;
  const appIds: number[] = await getAppIdsImpl({ tableName: tableName });

  console.log(`Starting installation fetch for appIds: ${JSON.stringify(appIds)}`);

  appIds.forEach(async (appId) => {
    console.log(`Starting installation fetch for appId: ${appId}`);

    const appToken = (await getAppTokenImpl({
      appId: appId,
      tableName: tableName,
    })).appToken;

    console.log(`Fetched appToken for appId: ${appId} - got ${appToken}`);

    const githubService = new GitHubAPIService({
      appToken: appToken,
      userAgent: "InstallationTracker/1.0"
    });

    console.log("Calling GitHub service to fetch required installations.");

    const actualInstallations = githubService.getInstallations({ });

    console.log(`Installations for appId ${appId}: ${JSON.stringify(actualInstallations)}`)
  });


  // console.log(`Event occurred. event: ${JSON.stringify(event)}`);

  //const tableName = checkEnvironmentImpl();

  // console.log("Fetching AppIDs...");

  //const appIds = await getAppIdsImpl(tableName);

  // console.log(`Found AppIDs: ${JSON.stringify(appIds)}`);


  // appIds.forEach(async (appId: string) => {
  //   console.log(`Getting AppToken for ID ${appId}`);

  //   await getAppTokenImpl({
  //     appId: parseInt(appId),
  //     tableName: tableName.tableName,
  //   });
  // });
  return {
    body: JSON.stringify({ unverifiedInstallations: [], missingInstallations: [] }),
    statusCode: 200,
  };
};

export type CheckEnvironment = () => {
  tableName: string;
};
/**
 * Verifies that required environment variables are set and attempts to App table name,
 * throws a EnvironmentError if the environment is not correctly configured.
 */
export const checkEnvironmentImpl: CheckEnvironment = () => {
  const tableName = process.env.APP_TABLE_NAME;
  if (!tableName) {
    throw new EnvironmentError(
      `No value found in ${EnvironmentVariables.APP_TABLE_NAME} environment variable.`,
    );
  }
  return { tableName };
};
