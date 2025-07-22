import {
  RefreshCachedDataInput,
  RefreshCachedDataOutput,
  getRefreshCachedDataHandler,
} from '@aws/app-framework-for-github-apps-on-aws-ssdk';
import {
  convertEvent,
  convertVersion1Response,
} from '@aws-smithy/server-apigateway';
import {
  APIGatewayEventRequestContextIAMAuthorizer,
  APIGatewayEventRequestContextV2WithAuthorizer,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { EnvironmentError } from '../../error';
import { EnvironmentVariables } from '../constants';
import { refreshCachedDataOperationImpl } from './refreshCachedDataOperation';

/**
 * Lambda entry point.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const context =
    event.requestContext as APIGatewayEventRequestContextV2WithAuthorizer<APIGatewayEventRequestContextIAMAuthorizer>;
  const result: APIGatewayProxyResultV2 = await handlerImpl({ event });
  const parseResponse = JSON.parse(JSON.stringify(result));
  const bodyData = JSON.parse(parseResponse.body) as RefreshCachedDataOutput;
  if (!!bodyData.message && !!bodyData.refreshedDate) {
    const logResponse = {
      caller: context.authorizer.iam.userArn,
      message: bodyData.message,
      refreshedDate: bodyData.refreshedDate,
    };
    console.log(JSON.stringify(logResponse));
  }
  return result;
};

export type Handler = ({
  event,
  checkEnvironment,
  refreshCachedDataOperation,
}: {
  event: APIGatewayProxyEventV2;
  checkEnvironment?: CheckEnvironment;
  refreshCachedDataOperation?: (
    input: RefreshCachedDataInput,
    _context: { appTable: string; installationTable: string },
  ) => Promise<RefreshCachedDataOutput>;
}) => Promise<APIGatewayProxyResultV2>;

/**
 * Core Lambda handler logic for processing refreshing Installation cached data request.
 *
 * @param event Lambda event from Lambda Function URL.
 * @param checkEnvironment Checking environment config for appTable and installationTable.
 * @param refreshCachedDataOperation Operation for refreshing installation cached data.
 */
export const handlerImpl: Handler = async ({
  event,
  checkEnvironment = checkEnvironmentImpl,
  refreshCachedDataOperation = refreshCachedDataOperationImpl,
}) => {
  console.log('Event received', event);
  const context = checkEnvironment();
  const httpRequest = convertEvent(event);
  console.log('Smithy event:', httpRequest);
  const refreshCachedDataHandler = getRefreshCachedDataHandler(
    refreshCachedDataOperation,
  );
  const result = await refreshCachedDataHandler.handle(httpRequest, context);
  return convertVersion1Response(result);
};
/**
 *  Retrieves Installations Table and App Table names
 *
 ---
 @returns An Installations Table and App Table names
 @throws EnvironmentError if Installations Table or App Table names are not present
 */
type CheckEnvironment = () => {
  appTable: string;
  installationTable: string;
};
const checkEnvironmentImpl: CheckEnvironment = () => {
  const appTable = process.env.APP_TABLE_NAME;
  if (!appTable) {
    throw new EnvironmentError(
      `No value found in ${EnvironmentVariables.APP_TABLE_NAME} environment variable.`,
    );
  }
  const installationTable = process.env.INSTALLATION_TABLE_NAME;
  if (!installationTable) {
    throw new EnvironmentError(
      `No value found in ${EnvironmentVariables.INSTALLATION_TABLE_NAME} environment variable.`,
    );
  }
  return {
    appTable,
    installationTable,
  };
};
