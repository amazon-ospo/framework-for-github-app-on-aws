import { Operation } from '@aws-smithy/server-common';
import {
  ClientSideError,
  GetInstallationTokenInput,
  GetInstallationTokenOutput,
} from '@framework.api/app-framework-ssdk';
import { getInstallationAccessTokenImpl } from './getInstallationAccessToken';
import { ClientError, RequestError } from '../../error';

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
    // Smithy default validation does not catch errors such as empty strings hence adding in
    // a second layer of error handling.
    if (!input.appId || !input.nodeId) {
      throw new RequestError(
        `Request Error: { appId: ${input.appId}, nodeId: ${input.nodeId}}`,
      );
    }
    const result = await getInstallationAccessTokenImpl({
      appId: input.appId,
      nodeId: input.nodeId,
      appTable: _context.appTable,
      installationTable: _context.installationTable,
    });
    return result;
  } catch (error) {
    if (error instanceof ClientError) {
      throw new ClientSideError({
        message: error.message,
      });
    }
    throw error;
  }
};
