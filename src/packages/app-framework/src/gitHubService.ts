import { Octokit } from '@octokit/rest';
import { DataError, GitHubError, GitHubRequestError } from './error';
import {
  AppAuthenticationResponseType,
  AppInstallationsResponseType,
  GetInstallationAccessTokenResponseType,
  GetRateLimitResponseType,
} from './types';

export interface GitHubAPIServiceInput {
  readonly token?: string;
  readonly userAgent?: string;
}

export class GitHubAPIService {
  private readonly config: GitHubAPIServiceInput;

  constructor(input: GitHubAPIServiceInput) {
    this.config = input;
  }

  getOctokitClient() {
    return new Octokit({
      auth: this.config.token,
      userAgent: this.config.userAgent || 'framework-for-github-app-on-aws',
      request: {
        timeout: 10000, // 10 seconds timeout
      },
      baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
      log: {
        debug: () => {},
        info: () => {},
        warn: console.warn,
        error: console.error,
      },
      retry: {
        enabled: true,
        retries: 3,
      },
    });
  }

  async getInstallations({
    octokitClient = this.getOctokitClient.bind(this),
  }: {
    octokitClient?: () => Octokit;
  }): Promise<AppInstallationsResponseType> {
    const octokit = octokitClient();

    try {
      const installations = await octokit.paginate(
        octokit.rest.apps.listInstallations,
        { per_page: 100 },
      );

      return installations as AppInstallationsResponseType;
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const headers = err?.response?.headers;
      const data = err?.response?.data;

      throw new GitHubError(
        `GitHub API Error: status: ${status}, headers: ${JSON.stringify(
          headers,
        )}, error: ${JSON.stringify(data)}`,
      );
    }
  }

  async getInstallationToken({
    installationId,
    repositoryIds,
    repositoryNames,
    permissions,
    octokitClient: octokitClient = this.getOctokitClient.bind(this),
  }: {
    installationId: number;
    repositoryIds?: number[];
    repositoryNames?: string[];
    permissions?: {
      [key: string]: string;
    };
    octokitClient?: () => Octokit;
  }): Promise<GetInstallationAccessTokenResponseType> {
    const octokit = octokitClient();
    try {
      const response = await octokit.rest.apps.createInstallationAccessToken({
        installation_id: installationId,
        repository_ids: repositoryIds,
        repositories: repositoryNames,
        permissions,
      });
      if (response.status >= 400) {
        throw new GitHubError(
          `GitHub API Error: status: ${response.status}, headers: ${response.headers}, error: ${response.data}`,
        );
      }

      if (!!response.data.token) {
        return response.data;
      }
    } catch (error: any) {
      console.error(`Uncaught error calling octokit ${JSON.stringify(error)}`);
      throw new GitHubRequestError(
        `GitHub API Request Error: ${error.message}`,
      );
    }

    throw new DataError(
      'GitHub API Error: No installation access token returned',
    );
  }

  async getAuthenticatedApp({
    octokitClient: octokitClient = this.getOctokitClient.bind(this),
  }: {
    octokitClient?: () => Octokit;
  }): Promise<AppAuthenticationResponseType> {
    const octokit = octokitClient();
    try {
      const response = await octokit.rest.apps.getAuthenticated();

      if (response.status >= 400) {
        throw new GitHubError(
          `GitHub API Error: status: ${response.status}, headers: ${response.headers}, error: ${response.data}`,
        );
      }
      if (!!response.data && !!response.data.id && !!response.data.name) {
        return response.data;
      }
      console.error('GitHub Output:', JSON.stringify(response.data));
    } catch (error) {
      console.error(`Uncaught error calling octokit ${JSON.stringify(error)}`);
      throw error;
    }

    throw new DataError(
      'GitHub API Error: No name or id returned for authenticated app',
    );
  }

  async getRateLimit({
    octokitClient: octokitClient = this.getOctokitClient.bind(this),
  }: {
    octokitClient?: () => Octokit;
  }): Promise<GetRateLimitResponseType> {
    const octokit = octokitClient();
    const response = await octokit.rest.rateLimit.get();
    if (response.status >= 400) {
      throw new GitHubError(
        `GitHub API Error: status: ${response.status}, headers: ${response.headers}, error: ${response.data}`,
      );
    }

    if (!!response.data) {
      return response.data;
    }
    console.error('GitHub Output: ', JSON.stringify(response.data));
    throw new DataError(
      'GitHub API Error: No name or id returned for authenticated app',
    );
  }
}
