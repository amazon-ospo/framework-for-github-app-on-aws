import { Octokit } from '@octokit/rest';
import { DataError, GitHubError } from './error';
import {
  AppAuthenticationResponseType,
  AppInstallationsResponseType,
  GetInstallationAccessTokenResponseType,
} from './types';

export interface GitHubAPIServiceInput {
  readonly appToken?: string;
  readonly userAgent?: string;
}

export class GitHubAPIService {
  private readonly config: GitHubAPIServiceInput;

  constructor(input: GitHubAPIServiceInput) {
    this.config = input;
  }

  getOctokitClient() {
    return new Octokit({
      auth: this.config.appToken,
      userAgent: this.config.userAgent,
    });
  }

  async getInstallations({
    ocktokitClient = this.getOctokitClient.bind(this),
  }: {
    ocktokitClient?: () => Octokit;
  }): Promise<AppInstallationsResponseType> {
    const octokit = ocktokitClient();
    const response = await octokit.rest.apps.listInstallations();

    if (response.status >= 400) {
      throw new GitHubError(
        `GitHub API Error: status: ${response.status}, headers: ${response.headers}, error: ${response.data}`,
      );
    }

    return response.data;
  }

  async getInstallationToken({
    installationId,
    ocktokitClient = this.getOctokitClient.bind(this),
  }: {
    installationId: number;
    ocktokitClient?: () => Octokit;
  }): Promise<GetInstallationAccessTokenResponseType> {
    const octokit = ocktokitClient();
    const response = await octokit.rest.apps.createInstallationAccessToken({
      installation_id: installationId,
    });

    if (response.status >= 400) {
      throw new GitHubError(
        `GitHub API Error: status: ${response.status}, headers: ${response.headers}, error: ${response.data}`,
      );
    }

    if (!!response.data.token) {
      return response.data;
    }
    console.error('GitHub Output:', JSON.stringify(response.data));
    throw new DataError(
      'GitHub API Error: No installation access token returned',
    );
  }

  async getAuthenticatedApp({
    ocktokitClient = this.getOctokitClient.bind(this),
  }: {
    ocktokitClient?: () => Octokit;
  }): Promise<AppAuthenticationResponseType> {
    console.log("Getting octokit client");
    const octokit = ocktokitClient();
    console.log("Getting octokit client authenticated app");
    const response = await octokit.rest.apps.getAuthenticated();
    console.log(`Successfully got octokit client authenticated app ${JSON.stringify(response)}`);
    if (response.status >= 400) {
      throw new GitHubError(
        `GitHub API Error: status: ${response.status}, headers: ${response.headers}, error: ${response.data}`,
      );
    }
    if (!!response.data && !!response.data.id && !!response.data.name) {
      return response.data;
    }
    console.error('GitHub Output:', JSON.stringify(response.data));
    throw new DataError(
      'GitHub API Error: No name or id returned for authenticated app',
    );
  }
}
