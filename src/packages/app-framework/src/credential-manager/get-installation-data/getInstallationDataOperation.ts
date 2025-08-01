import {
  ClientSideError,
  ServerSideError,
  GetInstallationDataInput,
  GetInstallationDataOutput,
} from '@aws/app-framework-for-github-apps-on-aws-ssdk';
import { Operation } from '@aws-smithy/server-common';
import { getInstallationsDataImpl } from './getInstallationData';
import { NotFound } from '../../error';

/**
 * Smithy operation that retrieves installation data from DynamoDB.
 * @param input Contains the nodeId as input to the operation
 * @param _context Contains installationTable name
 * @returns Installation data for the specified nodeId
 * @throws ClientSideError if the request is invalid (e.g., nodeId not found)
 * @throws ServerSideError if there's an internal server error
 */
export const getInstallationRecordOperationImpl: Operation<
  GetInstallationDataInput,
  GetInstallationDataOutput,
  { installationTable: string }
> = async (input, _context) => {
  try {
    const { nodeId } = input as { nodeId: string };
    return await getInstallationsDataImpl({
      nodeId,
      installationTable: _context.installationTable,
    });
  } catch (error) {
    if (error instanceof NotFound) {
      throw new ClientSideError({ message: `Invalid Request: ${error}` });
    }
    console.error(error);
    throw new ServerSideError({ message: 'Internal Server Error' });
  }
};
