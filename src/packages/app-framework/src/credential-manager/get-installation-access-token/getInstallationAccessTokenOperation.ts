import {
  ClientSideError,
  GetInstallationTokenInput,
  GetInstallationTokenOutput,
  ServerSideError,
} from '@aws/app-framework-ssdk';
import { Operation } from '@aws-smithy/server-common';
import { getInstallationAccessTokenImpl } from './getInstallationAccessToken';
import { VisibleError } from '../../error';

/**
 *  Smithy operation that retrieves Installation Access token from GitHub APIs.
 *  --
 *  @param input contains the appId and the nodeId as inputs to the operation
 *  @param _context contains appTable and installationTable
 *  @returns An Installation Access Token with App ID and Node ID
 *  @throws ClientError smithy generated error thrown incase there is some error with the request
 */
export const getInstallationAccessTokenOperationImpl: Operation<
  GetInstallationTokenInput,
  GetInstallationTokenOutput,
  { appTable: string; installationTable: string }
> = async (input, _context) => {
  try {
    const { appId, nodeId } = input as { appId: number; nodeId: string };
    const result = await getInstallationAccessTokenImpl({
      appId,
      nodeId,
      appTable: _context.appTable,
      installationTable: _context.installationTable,
    });
    return result;
  } catch (error) {
    if (error instanceof VisibleError) {
      throw new ClientSideError({ message: `Invalid Request: ${error}` });
    }
    console.error(error);
    throw new ServerSideError({ message: 'Internal Server Error' });
  }
};
