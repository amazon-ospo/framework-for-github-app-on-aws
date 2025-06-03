import { Octokit } from '@octokit/rest';
import { DataError, GitHubError } from './error';
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
    ocktokitClient: octokitClient = this.getOctokitClient.bind(this),
  }: {
    installationId: number;
    ocktokitClient?: () => Octokit;
  }): Promise<GetInstallationAccessTokenResponseType> {
    const octokit = octokitClient();
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
    throw new DataError(
      'GitHub API Error: No installation access token returned',
    );
  }

  async getAuthenticatedApp({
    ocktokitClient = this.getOctokitClient.bind(this),
  }: {
    ocktokitClient?: () => Octokit;
  }): Promise<AppAuthenticationResponseType> {
    const octokit = ocktokitClient();
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
    ocktokitClient = this.getOctokitClient.bind(this),
  }: {
    ocktokitClient?: () => Octokit;
  }): Promise<GetRateLimitResponseType> {
    const octokit = ocktokitClient();
    const response = await octokit.rest.rateLimit.get();
    if (response.status >= 400) {
      throw new GitHubError(
        `GitHub API Error: status: ${response.status}, headers: ${response.headers}, error: ${response.data}`,
      );
    }

    if (!!response.data) {
      return response.data;
    }
    console.error('GitHub Output:', JSON.stringify(response.data));
    throw new DataError(
      'GitHub API Error: No name or id returned for authenticated app',
    );
  }
}
