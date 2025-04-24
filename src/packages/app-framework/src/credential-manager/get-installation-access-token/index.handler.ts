import {
  convertEvent,
  convertVersion1Response,
} from '@aws-smithy/server-apigateway';
import {
  GetInstallationTokenInput,
  GetInstallationTokenOutput,
  getGetInstallationTokenHandler,
} from '@framework.api/app-framework-ssdk';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { InstallationAccessTokenEnvironmentVariables } from './constants';
import { getInstallationAccessTokenOperationImpl } from './getInstallationAccessTokenOperation';
import { EnvironmentError } from '../../error';

/**
 * Lambda entry point.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  return handlerImpl({ event });
};

export type Handler = ({
  event,
  checkEnvironment,
  getInstallationAccessTokenOperation,
}: {
  event: APIGatewayProxyEventV2;
  checkEnvironment?: CheckEnvironment;
  getInstallationAccessTokenOperation?: (
    input: GetInstallationTokenInput,
    _context: { appTable: string; installationTable: string },
  ) => Promise<GetInstallationTokenOutput>;
}) => Promise<APIGatewayProxyResult>;

/**
 * Core Lambda handler logic for processing GetAppToken requests.
 *
 *
 * @param event Lambda event from Lambda Function URL which share same schema as API Gateway event containing appId
 * and nodeId.
 * @param checkEnvironment Checking environment config for appTable and installationTable.
 * @param getInstallationAccessTokenOperation Operation for getting generated installation access token.
 *
 * @returns installationAccessToken: string, appId: number, nodeId: number
 */

export const handlerImpl: Handler = async ({
  event,
  checkEnvironment = checkEnvironmentImpl,
  getInstallationAccessTokenOperation = getInstallationAccessTokenOperationImpl,
}) => {
  console.log('Event received', event);
  const context = checkEnvironment();
  const httpRequest = convertEvent(event);
  console.log('Smithy event:', httpRequest);
  const installationAccessTokenhandler = getGetInstallationTokenHandler(
    getInstallationAccessTokenOperation,
  );
  const result = await installationAccessTokenhandler.handle(
    httpRequest,
    context,
  );
  return convertVersion1Response(result);
};

export type CheckEnvironment = () => {
  appTable: string;
  installationTable: string;
};

/**
 *  Retrieves Installations Table and App Table names
 *
 ---
 @returns An Installations Table and App Table names
 @throws EnvironmentError incase Installations Table or App Table names are not present
 */
export const checkEnvironmentImpl: CheckEnvironment = () => {
  const appTableName =
    process.env[InstallationAccessTokenEnvironmentVariables.APP_TABLE_NAME]!;
  if (!appTableName) {
    throw new EnvironmentError(
      `No value found in ${InstallationAccessTokenEnvironmentVariables.APP_TABLE_NAME} environment variable.`,
    );
  }
  const installationTableName =
    process.env[
      InstallationAccessTokenEnvironmentVariables.INSTALLATIONS_TABLE_NAME
    ]!;
  if (!installationTableName) {
    throw new EnvironmentError(
      `No value found in ${InstallationAccessTokenEnvironmentVariables.INSTALLATIONS_TABLE_NAME} environment variable.`,
    );
  }
  return { appTable: appTableName, installationTable: installationTableName };
};
