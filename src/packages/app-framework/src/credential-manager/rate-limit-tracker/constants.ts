export const METRIC_NAMESPACE = 'AppFrameworkGitHubAPICallMetrics';
export const GITHUB_API_CALLS = 'GitHubAPICalls';
export const GITHUB_API_CALLS_REMAINING = 'GitHubAPICallsRemaining';
export const GITHUB_API_CALLS_REMAINING_PERCENT =
  'GitHubAPICallsRemainingPercent';
export const GITHUB_API_RATE_LIMIT = 'GitHubAPIRateLimit';
export const GITHUB_RATE_LIMIT_TIME_TO_RESET = 'GitHubRateLimitTimeToReset';
export const NEARING_RATELIMIT_THRESHOLD_ERROR =
  'NearingRateLimitThresholdError';
export const RATE_LIMIT_METRIC_DIMENSIONS = {
  category: 'Category',
  appId: 'AppID',
  nodeId: 'NodeID',
  installationId: 'InstallationID',
  calls: 'Calls',
  callsRemaining: 'CallsRemaining',
  rateLimit: 'RateLimit',
  timeToReset: 'TimeToReset',
};
