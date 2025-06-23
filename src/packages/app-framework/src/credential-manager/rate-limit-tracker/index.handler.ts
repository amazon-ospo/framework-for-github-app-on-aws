import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import {
  GitHubAPICalls,
  GitHubAPICallsRemaining,
  GitHubAPICallsRemainingPercent,
  GitHubAPIRateLimit,
  GitHubRateLimitTimeToReset,
  MetricNameSpace,
  RateLimitMetricDimensions,
} from './constants';
import { GetInstallations, getInstallationsImpl } from '../../data';
import { EnvironmentError } from '../../error';
import { GitHubAPIService } from '../../gitHubService';
import { EnvironmentVariables, ServiceName } from '../constants';
import {
  GetInstallationAccessToken,
  getInstallationAccessTokenImpl,
} from '../get-installation-access-token/getInstallationAccessToken';

/**
 * Lambda entry point.
 */
export const handler = async (): Promise<void> => {
  await handlerImpl({});
  return;
};

export type Handler = ({
  checkEnvironment,
  getInstallationAccessToken,
  getInstallationsFromTable,
}: {
  checkEnvironment?: CheckEnvironment;
  getInstallationAccessToken?: GetInstallationAccessToken;
  getInstallationsFromTable?: GetInstallations;
}) => Promise<void>;

/**
 * Handler function that generates metrics for GitHub App installation rate limits.
 * @param checkEnvironment returns table names present in the environment variables
 * @param getInstallationAccessToken retrieves installation access token based on App ID and Node ID
 * @param getInstallationsFromTable retrieves all installations currently present in the installations table
 */
export const handlerImpl: Handler = async ({
  checkEnvironment = checkEnvironmentImpl,
  getInstallationAccessToken = getInstallationAccessTokenImpl,
  getInstallationsFromTable = getInstallationsImpl,
}) => {
  const context = checkEnvironment();
  const installations = await getInstallationsFromTable({
    tableName: context.installationTable,
  });
  const metrics = new Metrics({
    namespace: MetricNameSpace,
    serviceName: ServiceName,
  });
  await Promise.all(
    installations.map(async (installation) => {
      const getinstallationAccessToken = await getInstallationAccessToken({
        appId: installation.appId,
        nodeId: installation.nodeId,
        installationTable: context.installationTable,
        appTable: context.appTable,
      });
      const githubService = new GitHubAPIService({
        token: getinstallationAccessToken.installationToken,
      });
      const rateLimit = await githubService.getRateLimit({});
      for (const [category, data] of Object.entries(rateLimit.resources)) {
        const resetDate = new Date(data.reset * 1000);
        const resetTimeSeconds = (resetDate.getTime() - Date.now()) / 1000;
        console.log(
          JSON.stringify({
            category: category,
            appId: installation.appId,
            nodeId: installation.nodeId,
            installationId: installation.installationId,
            calls: data.used,
            callsRemaining: data.remaining,
            rateLimit: data.limit,
            timeToReset: resetTimeSeconds,
          }),
        );
        const percentUsed = 100 * ((data.limit - data.used) / data.limit);
        metrics.addDimensions({
          [RateLimitMetricDimensions.category]: category,
          [RateLimitMetricDimensions.appId]: String(installation.appId),
          [RateLimitMetricDimensions.installationId]: String(
            installation.installationId,
          ),
        });

        metrics.addMetric(GitHubAPICalls, MetricUnit.Count, data.used);
        metrics.addMetric(
          GitHubAPICallsRemaining,
          MetricUnit.Count,
          data.remaining,
        );
        metrics.addMetric(
          GitHubAPICallsRemainingPercent,
          MetricUnit.Percent,
          percentUsed,
        );
        metrics.addMetric(GitHubAPIRateLimit, MetricUnit.Count, data.limit);
        metrics.addMetric(
          GitHubRateLimitTimeToReset,
          MetricUnit.Count,
          resetTimeSeconds,
        );
        await metrics.publishStoredMetrics();
      }
    }),
  );
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
  const appTableName = process.env[EnvironmentVariables.APP_TABLE_NAME]!;
  if (!appTableName) {
    throw new EnvironmentError(
      `No value found in ${EnvironmentVariables.APP_TABLE_NAME} environment variable.`,
    );
  }
  const installationTableName =
    process.env[EnvironmentVariables.INSTALLATION_TABLE_NAME]!;
  if (!installationTableName) {
    throw new EnvironmentError(
      `No value found in ${EnvironmentVariables.INSTALLATION_TABLE_NAME} environment variable.`,
    );
  }
  return { appTable: appTableName, installationTable: installationTableName };
};
