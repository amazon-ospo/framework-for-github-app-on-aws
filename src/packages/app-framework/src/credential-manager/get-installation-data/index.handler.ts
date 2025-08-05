import {
  GetInstallationDataInput,
  GetInstallationDataOutput,
  getGetInstallationDataHandler,
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
import { EnvironmentVariables } from '../constants';
import { getInstallationRecordOperationImpl } from './getInstallationDataOperation';
import { EnvironmentError } from '../../error';

/**
 * Lambda entry point for handling installation data requests.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const context =
    event.requestContext as APIGatewayEventRequestContextV2WithAuthorizer<APIGatewayEventRequestContextIAMAuthorizer>;
  const result: APIGatewayProxyResultV2 = await handlerImpl({ event });
  // Serialize/deserialize needed because APIGatewayProxyResultV2 is a union type,
  // string | APIGatewayProxyStructuredResultV2 | T,
  // TypeScript can't guarantee 'body' property exists.
  const parseResponse = JSON.parse(JSON.stringify(result));
  const body = parseResponse.body as GetInstallationDataOutput;
  if (!!body) {
    const logResponse = {
      caller: context.authorizer.iam.userArn,
      installations: body,
    };
    console.log(JSON.stringify(logResponse));
  }
  return result;
};

export type Handler = ({
  event,
  checkEnvironment,
  getInstallationRecordOperation,
}: {
  event: APIGatewayProxyEventV2;
  checkEnvironment?: CheckEnvironment;
  getInstallationRecordOperation?: (
    input: GetInstallationDataInput,
    _context: { installationTable: string },
  ) => Promise<GetInstallationDataOutput>;
}) => Promise<APIGatewayProxyResultV2>;

/**
 * Core Lambda handler logic for processing GetInstallationData requests.
 * @param event Lambda event from Lambda Function URL containing nodeId
 * @param checkEnvironment Function to check environment configuration for installationTable
 * @param getInstallationRecordOperation Operation for retrieving installation records
 * @returns API Gateway response containing installation data
 */

export const handlerImpl: Handler = async ({
  event,
  checkEnvironment = checkEnvironmentImpl,
  getInstallationRecordOperation = getInstallationRecordOperationImpl,
}) => {
  console.log('Event received', event);
  const getTableName = checkEnvironment();
  const httpRequest = convertEvent(event);
  console.log('Converted Http Request:', JSON.stringify(httpRequest));
  const installationRecordHandler = getGetInstallationDataHandler(
    getInstallationRecordOperation,
  );
  const result = await installationRecordHandler.handle(
    httpRequest,
    getTableName,
  );
  return convertVersion1Response(result);
};

export type CheckEnvironment = () => {
  installationTable: string;
};

/**
 * Retrieves Installation Table name from environment variables.
 * @returns Object containing the installation table name
 * @throws EnvironmentError if Installation Table name is not present
 */
export const checkEnvironmentImpl: CheckEnvironment = () => {
  const installationTableName =
    process.env[EnvironmentVariables.INSTALLATION_TABLE_NAME]!;
  if (!installationTableName) {
    throw new EnvironmentError(
      `No value found in ${EnvironmentVariables.INSTALLATION_TABLE_NAME} environment variable.`,
    );
  }
  return { installationTable: installationTableName };
};
