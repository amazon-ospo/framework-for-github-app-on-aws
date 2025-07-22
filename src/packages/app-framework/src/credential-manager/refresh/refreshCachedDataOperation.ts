import {
  ServerSideError,
  RefreshCachedDataInput,
  RefreshCachedDataOutput,
} from '@aws/app-framework-for-github-apps-on-aws-ssdk';
import { Operation } from '@aws-smithy/server-common';
import { refreshCachedDataImpl } from './refreshCachedData';

/**
 *  Smithy operation that refresh GitHub App installations cached data.
 *  --
 *  @param _input
 *  @param context contains the name of appTable and installationTable
 *  @returns A message shows the sync up successfully.
 */
export const refreshCachedDataOperationImpl: Operation<
  RefreshCachedDataInput,
  RefreshCachedDataOutput,
  { appTable: string; installationTable: string }
> = async (_input, context) => {
  try {
    const result = await refreshCachedDataImpl({
      appTable: context.appTable,
      installationTable: context.installationTable,
    });
    return result;
  } catch (error) {
    console.error(error);
    throw new ServerSideError({ message: 'Internal Server Error' });
  }
};
