import {
  ClientSideError,
  ServerSideError,
  GetInstallationsInput,
  GetInstallationsOutput,
} from '@aws/app-framework-for-github-apps-on-aws-ssdk';
import { Operation } from '@aws-smithy/server-common';
import { getInstallationRecordsImpl } from './getInstallations';
import { NotFound } from '../../error';

/**
 * Smithy operation that retrieves installation data and Last Evaluated Key from DynamoDB.
 * @param input Contains the limit and the Exclusive start key as input
 * @param _context Contains installationTable name
 * @returns Installation data for the specified nodeId
 * @throws ClientSideError if the request is invalid (e.g., nodeId not found)
 * @throws ServerSideError if there's an internal server error
 */
export const getInstallationsOperationImpl: Operation<
  GetInstallationsInput,
  GetInstallationsOutput,
  { installationTable: string }
> = async (input, _context) => {
  try {
    return await getInstallationRecordsImpl({
      installationTable: _context.installationTable,
      ExclusiveStartKey: input.nextToken,
      Limit: input.maxResults,
    });
  } catch (error) {
    if (error instanceof NotFound) {
      throw new ClientSideError({ message: `Invalid Request: ${error}` });
    }
    console.error(error);
    throw new ServerSideError({ message: 'Internal Server Error' });
  }
};
