import { GitHubAPIService } from '../src/gitHubService';

const mockGitHubService = new GitHubAPIService({});
let mockFetch = jest.spyOn(global, 'fetch');

describe('getInstallations', () => {
  it('should return list of installations if able to find in output', async () => {
    const listInstallations = [
      {
        id: 788,
        account: {
          node_id: 'first',
        },
        app_id: 1010,
      },
      {
        id: 789,
        account: {
          node_id: 'test',
        },
        app_id: 1011,
      },
    ];
    const mockSuccessResponse = new Response(
      JSON.stringify(listInstallations),
      {
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
      },
    );
    mockFetch.mockResolvedValue(mockSuccessResponse);

    const result = await mockGitHubService.getInstallations();
    expect(result).toEqual(listInstallations);
  });
  it('should return empty list of installations if able to find in output', async () => {
    const mockSuccessResponse = new Response(JSON.stringify([{}]), {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    mockFetch.mockResolvedValue(mockSuccessResponse);

    const result = await mockGitHubService.getInstallations();
    expect(result).toEqual([{}]);
  });
  it('should thow error if GitHub API has an error', async () => {
    const errorResponse = new Response('Invalid token', {
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'text/plain' }),
    });
    mockFetch.mockResolvedValueOnce(errorResponse);

    await expect(mockGitHubService.getInstallations()).rejects.toThrow(
      'GitHub API Error: status: 401, statusText: Unauthorized, error: Invalid token',
    );
  });
});

describe('getInstallationToken', () => {
  const installationId = 1234;
  const token = 'foo';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should return Installation ID if able to find in GitHub output', async () => {
    const mockSuccessResponse = new Response(
      JSON.stringify({
        token,
        expires_at: '2017-07-08T16:18:44-04:00',
        permissions: {},
        repository_selection: 'selected',
      }),
    );
    mockFetch.mockResolvedValue(mockSuccessResponse);
    const result = await mockGitHubService.getInstallationToken(installationId);
    expect(result).toEqual(token);
  });
  it('should throw error if unable to find Installation ID in GitHub output', async () => {
    const mockSuccessResponse = new Response(
      JSON.stringify({
        expires_at: '2017-07-08T16:18:44-04:00',
        permissions: {},
        repository_selection: 'selected',
      }),
    );
    mockFetch.mockResolvedValue(mockSuccessResponse);
    await expect(
      mockGitHubService.getInstallationToken(installationId),
    ).rejects.toThrow(
      'GitHub API Error: No installation access token returned',
    );
  });
  it('should thow error if GitHub API has an error', async () => {
    const errorResponse = new Response('Invalid token', {
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'text/plain' }),
    });
    mockFetch.mockResolvedValueOnce(errorResponse);

    await expect(
      mockGitHubService.getInstallationToken(installationId),
    ).rejects.toThrow(
      'GitHub API Error: status: 401, statusText: Unauthorized, error: Invalid token',
    );
  });
});
