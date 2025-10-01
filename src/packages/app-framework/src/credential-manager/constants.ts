import { name, version } from '../../package.json';

export const SERVICE_NAME = 'Credential Manager';
export const USER_AGENT = `${name}/${version}`;
export const TAG_KEYS = {
  FRAMEWORK_FOR_GITHUB_APP_ON_AWS_MANAGED: 'FrameworkForGitHubAppOnAwsManaged',
  STATUS: 'Status',
  CREDENTIAL_MANAGER: 'CredentialManager',
};
export const TAG_VALUES = {
  TRUE: 'true',
  ACTIVE: 'Active',
  APP_TOKEN_ENDPOINT: 'AppTokenEndpoint',
  INSTALLATION_ACCESS_TOKEN_ENDPOINT: 'InstallationAccessTokenEndpoint',
  INSTALLATION_CACHED_DATA_ENDPOINT: 'InstallationCachedDataEndpoint',
  REFRESH_CACHED_DATA_ENDPOINT: 'RefreshCachedDataEndpoint',
  INSTALLATIONS_ENDPOINT: 'InstallationsEndpoint',
};

export enum EnvironmentVariables {
  APP_TABLE_NAME = 'APP_TABLE_NAME',
  INSTALLATION_TABLE_NAME = 'INSTALLATION_TABLE_NAME',
}
