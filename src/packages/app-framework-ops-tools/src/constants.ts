import { name, version } from '../package.json';
// Tags for DynamoDB App Table
export enum TagName {
  FRAMEWORK_FOR_GITHUB_APP_ON_AWS_MANAGED = 'FrameworkForGitHubAppOnAwsManaged',
  CREDENTIAL_MANAGER = 'CredentialManager',
  APP_TABLE = 'AppTable',
}

// Key Specifications
// Docs: https://docs.aws.amazon.com/kms/latest/APIReference/API_GetParametersForImport.html#API_GetParametersForImport_RequestSyntax
export const WRAPPING_SPEC = 'RSA_4096';
// Docs: https://docs.aws.amazon.com/kms/latest/APIReference/API_CreateKey.html#API_CreateKey_RequestSyntax
export const CREATE_KEY_SPEC = 'RSA_2048';

export const RESOURCES_PER_PAGE = 10;

export const USER_AGENT = `${name}/${version}`;
