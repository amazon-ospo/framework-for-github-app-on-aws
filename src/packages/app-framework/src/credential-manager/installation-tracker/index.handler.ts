import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
// import { getAppIdsImpl } from '../../data';
import { EnvironmentError } from '../../error';
// import { GitHubAPIService } from '../../gitHubService';
import { getHashedToken } from '../../helper';
import { EnvironmentVariables } from '../get-app-token/constants';
import { getAppTokenImpl } from '../get-app-token/getAppToken';

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  console.log('Entered function');
  const result = await handlerImpl(event);

  const parseResponse = JSON.parse(JSON.stringify(result));
  const bodyData = JSON.parse(parseResponse.body);

  const logResponse = {
    appId: bodyData.appId,
    expirationTime: bodyData.expirationTime,
    hashedToken: getHashedToken(bodyData.appToken as string),
  };

  console.log(JSON.stringify(logResponse));
  return result;
};

export const handlerImpl = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {

    console.log(`Event occurred. event: ${JSON.stringify(event)}`);
    await getAppTokenImpl({
      appId: 1222135,
      tableName: "the-app-framework-test-stack-CredentialManagerNestedStackCredentialManagerNestedStackR-Q1YMEM4SB95W-AppTable815C50BC-1FJENP0I5OQ0E",
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
  } catch (error) {
    console.log(`An uncaught error has occurred: ${JSON.stringify(error)}`);
  }

  return {
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
