import { GitHubError, ServerError } from './error';
import { AppInstallationType, InstallationAccessTokenResponse } from './types';

export interface GitHubAPIServiceInput {
  readonly appToken?: string;
}

export class GitHubAPIService {
  private readonly config: GitHubAPIServiceInput;
  constructor(input: GitHubAPIServiceInput) {
    this.config = input;
  }

  // TODO: Replace all fetch calls with calls from the Octokit
  async getInstallations(): Promise<AppInstallationType[]> {
    const response = await fetch('https://api.github.com/app/installations', {
      headers: {
        // eslint-disable-next-line quote-props
        Authorization: `Bearer ${this.config.appToken}`,
        // eslint-disable-next-line quote-props
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new GitHubError(
        `GitHub API Error: status: ${response.status}, statusText: ${response.statusText}, error: ${errorText}`,
      );
    }

    const result: any = (await response.json()) as AppInstallationType[];
    return result;
  }

  async getInstallationToken(installationId: number): Promise<string> {
    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          // eslint-disable-next-line quote-props
          Authorization: `Bearer ${this.config.appToken}`,
          // eslint-disable-next-line quote-props
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new ServerError(
        `GitHub API Error: status: ${response.status}, statusText: ${response.statusText}, error: ${errorText}`,
      );
    }

    const result: InstallationAccessTokenResponse =
      (await response.json()) as InstallationAccessTokenResponse;

    if (!!result.token) {
      return result.token;
    }
    console.error('GitHub Output:', JSON.stringify(result));
    throw new ServerError(
      'GitHub API Error: No installation access token returned',
    );
  }
}
