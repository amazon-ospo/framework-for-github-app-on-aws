import {
  convertEvent,
  convertVersion1Response,
} from '@aws-smithy/server-apigateway';
import {
  getGetAppTokenHandler,
  GetAppTokenInput,
  GetAppTokenOutput,
  ServerSideError,
} from '@framework.api/app-framework-ssdk';
import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { EnvironmentVariables } from './constants';
import { getAppTokenOperation as getAppTokenOperationImpl } from './getAppTokenOperation';
import { EnvironmentError } from '../../error';
/**
 * Lambda entry point.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  return handlerImpl({ event });
};

export type CheckEnvironment = () => {
  tableName: string;
};
export type Handler = ({
  event,
  checkEnvironment,
  getAppTokenOperation,
}: {
  event: APIGatewayProxyEventV2;
  checkEnvironment?: CheckEnvironment;
  getAppTokenOperation?: (
    input: GetAppTokenInput,
    _context: { tableName: string },
  ) => Promise<GetAppTokenOutput>;
}) => Promise<APIGatewayProxyResult>;

/**
 * Core Lambda handler logic for processing GetAppToken requests.
 *
 *
 * @param event Lambda event from Lambda Function URL which share same schema as API Gateway event.
 * @param checkEvent Function that checks the event for required values.
 * @param checkEnvironment Checking environment config (e.g., table name).
 * @param getAppTokenOperation Operation for getting generated App token.
 *
 * @returns appId: string, appToken: string.
 */

export const handlerImpl: Handler = async ({
  event,
  checkEnvironment = checkEnvironmentImpl,
  getAppTokenOperation = getAppTokenOperationImpl,
}) => {
  try {
    const context = checkEnvironment();
    const httpRequest = convertEvent(event);
    const appTokenHandler = getGetAppTokenHandler(getAppTokenOperation);
    const response = await appTokenHandler.handle(httpRequest, context);
    return convertVersion1Response(response);
  } catch (error) {
    if (error instanceof EnvironmentError) {
      throw new ServerSideError({ message: 'Internal Server Error' });
    }
    throw error;
  }
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
