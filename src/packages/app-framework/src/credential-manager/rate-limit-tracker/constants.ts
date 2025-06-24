export const METRIC_NAMESPACE = 'AppFrameworkGitHubAPICallMetrics';
export const GITHUB_API_CALLS = 'GitHubAPICalls';
export const GITHUB_API_CALLS_REMAINING = 'GitHubAPICallsRemaining';
export const GITHUB_API_CALLS_REMAINING_PERCENT =
  'GitHubAPICallsRemainingPercent';
export const GITHUB_API_RATE_LIMIT = 'GitHubAPIRateLimit';
export const GitHubRateLimitTimeToReset = 'GitHubRateLimitTimeToReset';
export const NEARING_RATELIMIT_THRESHOLD_ERROR =
  'NearingRateLimitThresholdError';
export const RateLimitMetricDimensions = {
  category: 'Category',
  appId: 'AppID',
  nodeId: 'NodeID',
  installationId: 'InstallationID',
  calls: 'Calls',
  callsRemaining: 'CallsRemaining',
  rateLimit: 'RateLimit',
  timeToReset: 'TimeToReset',
};
