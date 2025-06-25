import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import {
  GITHUB_API_CALLS,
  GITHUB_API_CALLS_REMAINING,
  GITHUB_API_CALLS_REMAINING_PERCENT,
  GITHUB_API_RATE_LIMIT,
  GITHUB_RATE_LIMIT_TIME_TO_RESET,
  METRIC_NAMESPACE,
  RATE_LIMIT_METRIC_DIMENSIONS,
} from './constants';
import { GetInstallations, getInstallationsImpl } from '../../data';
import { EnvironmentError } from '../../error';
import { GitHubAPIService } from '../../gitHubService';
import { EnvironmentVariables, SERVICE_NAME } from '../constants';
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
    namespace: METRIC_NAMESPACE,
    serviceName: SERVICE_NAME,
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
          [RATE_LIMIT_METRIC_DIMENSIONS.category]: category,
          [RATE_LIMIT_METRIC_DIMENSIONS.appId]: String(installation.appId),
          [RATE_LIMIT_METRIC_DIMENSIONS.installationId]: String(
            installation.installationId,
          ),
        });

        metrics.addMetric(GITHUB_API_CALLS, MetricUnit.Count, data.used);
        metrics.addMetric(
          GITHUB_API_CALLS_REMAINING,
          MetricUnit.Count,
          data.remaining,
        );
        metrics.addMetric(
          GITHUB_API_CALLS_REMAINING_PERCENT,
          MetricUnit.Percent,
          percentUsed,
        );
        metrics.addMetric(GITHUB_API_RATE_LIMIT, MetricUnit.Count, data.limit);
        metrics.addMetric(
          GITHUB_RATE_LIMIT_TIME_TO_RESET,
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
