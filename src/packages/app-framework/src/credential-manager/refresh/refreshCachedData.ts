import { RefreshCachedDataOutput } from '@aws/app-framework-for-github-apps-on-aws-ssdk';
import {
  getAppIdsImpl,
  getMappedInstallationIdsImpl,
  InstallationRecord,
  PutInstallation,
  putInstallationImpl,
  GetAppIds,
  GetMappedInstallations,
} from '../../data';
import { ServerError } from '../../error';
import { GitHubAPIService } from '../../gitHubService';
import { GetAppToken, getAppTokenImpl } from '../get-app-token/getAppToken';
import {
  calculateInstallationDifferencesImpl,
  CalculateInstallationDifferences,
} from '../installation-tracker/index.handler';

export type RefreshCachedData = ({
  appTable,
  installationTable,
  getAppIds,
  getMappedInstallationIds,
  getAppToken,
  calculateInstallationDifferences,
  putInstallation,
}: {
  appTable: string;
  installationTable: string;
  getAppIds?: GetAppIds;
  getMappedInstallationIds?: GetMappedInstallations;
  getAppToken?: GetAppToken;
  calculateInstallationDifferences?: CalculateInstallationDifferences;
  putInstallation?: PutInstallation;
}) => Promise<RefreshCachedDataOutput>;
/**
 * Syncs installation data between GitHub and DynamoDB.
 * Retrieves all App IDs from the App Table, fetches current installations from GitHub, and updates
 * the Installation Table with a refreshed timestamp. It also identifies:
 * - Unverified installations: in GitHub but missing in DynamoDB
 * - Missing installations: in DynamoDB but not found in GitHub
 * @param appTable - Name of the DynamoDB table storing GitHub App metadata
 * @param installationTable - Name of the DynamoDB table storing installation metadata
 * @param getAppIds - Function for fetching App IDs
 * @param getMappedInstallationIds - Function for retrieving registered installations
 * @param getAppToken - Function for retrieving GitHub App tokens
 * @param calculateInstallationDifferences - Function for computing discrepancies
 * @param putInstallation - Function for writing installation records
 * @returns A message confirming sync and the timestamp of the refresh
 * @throws ServerError if any error detected
 */
export const refreshCachedDataImpl: RefreshCachedData = async ({
  appTable,
  installationTable,
  getAppIds = getAppIdsImpl,
  getMappedInstallationIds = getMappedInstallationIdsImpl,
  getAppToken = getAppTokenImpl,
  calculateInstallationDifferences = calculateInstallationDifferencesImpl,
  putInstallation = putInstallationImpl,
}): Promise<RefreshCachedDataOutput> => {
  try {
    // Find all AppIds for this account.
    const appIds: number[] = await getAppIds({ tableName: appTable });

    // Find all installations for this account, split by AppId.
    // Registered installations are known in DynamoDB.
    const registeredInstallations = await getMappedInstallationIds({
      tableName: installationTable,
    });
    // GitHub installations are actual installations that GitHub has.
    const githubConfirmedInstallations: Record<number, InstallationRecord[]> =
      {};
    // Find all installations for this account, according to GitHub.
    await Promise.all(
      appIds.map(async (appId) => {
        // Fetch each AppToken for this account.
        const appToken = (await getAppToken({ appId, tableName: appTable }))
          .appToken;
        // Using the App identity granted by the AppToken, generate a GitHub client.
        const githubService = new GitHubAPIService({ token: appToken });
        // Fetch installations from GitHub and map them to the fields we need.
        const actualInstallations = await githubService.getInstallations({});
        const gitHubInstallations: InstallationRecord[] = await Promise.all(
          actualInstallations.map((installation) => {
            return {
              installationId: installation.id,
              appId: appId,
              nodeId: installation.account ? installation.account.node_id : '',
              targetType: installation.target_type,
              name:
                installation.account?.login || installation.account?.slug || '',
            };
          }),
        );
        githubConfirmedInstallations[appId] = gitHubInstallations;
        // Update last refreshed timestamp to all items.
        await Promise.all(
          gitHubInstallations.map(async (installation) => {
            await putInstallation({
              tableName: installationTable,
              ...installation,
              lastRefreshed: new Date().toISOString(),
            });
          }),
        );
      }),
    );
    // Calculate where GitHub has more installations than we have registered,
    // or where Dynamo has installations GitHub doesn't know about.
    const { unverifiedInstallations, missingInstallations } =
      await calculateInstallationDifferences({
        appIds,
        githubConfirmedInstallations,
        registeredInstallations,
      });
    console.log('Updated:', unverifiedInstallations);
    console.log('Deleted:', missingInstallations);
    return {
      message: 'Installation sync completed.',
      refreshedDate: new Date(),
    };
  } catch (error: any) {
    console.error('Installation sync failed:', error);
    throw new ServerError(error.message);
  }
};
