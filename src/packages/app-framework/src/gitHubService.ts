import { Octokit } from '@octokit/rest';
import { DataError, GitHubError } from './error';
import { AppInstallationType } from './types';

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
  }): Promise<AppInstallationType[]> {
    const octokit = ocktokitClient();
    const response = await octokit.rest.apps.listInstallations();

    if (response.status >= 400) {
      throw new GitHubError(
        `GitHub API Error: status: ${response.status}, statusText: ${response.headers}, error: ${response.data}`,
      );
    }

    return response.data as AppInstallationType[];
  }

  async getInstallationToken({
    installationId,
    ocktokitClient = this.getOctokitClient.bind(this),
  }: {
    installationId: number;
    ocktokitClient?: () => Octokit;
  }): Promise<string> {
    const octokit = ocktokitClient();
    const response = await octokit.rest.apps.createInstallationAccessToken({
      installation_id: installationId,
    });

    if (response.status >= 400) {
      throw new GitHubError(
        `GitHub API Error: status: ${response.status}, statusText: ${response.headers}, error: ${response.data}`,
      );
    }

    if (!!response.data.token) {
      return response.data.token;
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
  }): Promise<{ id: number; name: string }> {
    const octokit = ocktokitClient();
    const response = await octokit.rest.apps.getAuthenticated();
    if (response.status >= 400) {
      throw new GitHubError(
        `GitHub API Error: status: ${response.status}, statusText: ${response.headers}, error: ${response.data}`,
      );
    }
    if (!!response.data && response.data.id && !!response.data.name) {
      return { id: response.data.id, name: response.data.name };
    }
    console.error('GitHub Output:', JSON.stringify(response.data));
    throw new DataError(
      'GitHub API Error: No name or id returned for authenticated app',
    );
  }
}
