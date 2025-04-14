import {
  convertEvent,
  convertVersion1Response,
} from '@aws-smithy/server-apigateway';
import {
  getGetAppTokenHandler,
  GetAppTokenInput,
  GetAppTokenOutput,
} from '@framework.api/app-framework-ssdk';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { EnvironmentVariables } from './constants';
import { getAppTokenOperation as getAppTokenOperationImpl } from './getAppTokenOperation';
import { EnvironmentError } from '../../error';
/**
 * Lambda entry point.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2 | ErrorResponse> => {
  return handlerImpl({ event });
};

export type CheckEnvironment = () => {
  tableName: string;
};
export type ErrorResponse = {
  error: string;
  message?: string;
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
}) => Promise<APIGatewayProxyResultV2 | ErrorResponse>;

/**
 * Core Lambda handler logic for processing GetAppToken requests.
 *
 *
 * @param event Lambda event from Lambda Function URL which share same schema as API Gateway event.
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
    if (response.statusCode >= 400 && response.statusCode < 599) {
      const error_message = JSON.parse(response.body).message;
      const errorResponse: APIGatewayProxyResultV2 = {
        statusCode: response.statusCode,
        body: JSON.stringify({
          error: response.headers['x-amzn-errortype'],
          message: error_message,
        }),
      };
      return errorResponse;
    }
    return convertVersion1Response(response);
  } catch (error) {
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
