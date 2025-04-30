import { Octokit } from '@octokit/rest';
import { GitHubError, DataError } from '../src/error';
import { GitHubAPIService } from '../src/gitHubService';

//TODO: Remove mock after Jest is able to build properly with Octokit

type MockOctokitResponse<T> = Promise<{
  status: number;
  data: T;
  headers: any;
  url: string;
}>;

const mockOctokitRest = {
  apps: {
    listInstallations: jest.fn<MockOctokitResponse<any>, []>(),
    createInstallationAccessToken: jest.fn<MockOctokitResponse<any>, [any]>(),
    getAuthenticated: jest.fn<MockOctokitResponse<any>, [any]>(),
  },
};

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: mockOctokitRest,
  })),
}));

describe('GitHubAPIService', () => {
  let service: GitHubAPIService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GitHubAPIService({});
  });

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

      mockOctokitRest.apps.listInstallations.mockResolvedValue({
        status: 200,
        data: listInstallations,
        headers: {},
        url: '',
      });

      const result = await service.getInstallations({
        ocktokitClient: () => new Octokit() as any,
      });
      expect(result).toEqual(listInstallations);
    });

    it('should return empty list of installations if able to find in output', async () => {
      mockOctokitRest.apps.listInstallations.mockResolvedValue({
        status: 200,
        data: [{}],
        headers: {},
        url: '',
      });

      const result = await service.getInstallations({
        ocktokitClient: () => new Octokit() as any,
      });
      expect(result).toEqual([{}]);
    });

    it('should throw error if GitHub API has an error', async () => {
      mockOctokitRest.apps.listInstallations.mockResolvedValue({
        status: 401,
        data: 'Invalid token',
        headers: { 'content-type': 'text/plain' },
        url: '',
      });

      await expect(
        service.getInstallations({
          ocktokitClient: () => new Octokit() as any,
        }),
      ).rejects.toThrow(GitHubError);
    });
  });

  describe('getInstallationToken', () => {
    const installationId = 1234;
    const token = 'foo';

    it('should return Installation ID if able to find in GitHub output', async () => {
      const data = {
        token,
        expires_at: '2017-07-08T16:18:44-04:00',
        permissions: {},
        repository_selection: 'selected',
      };
      mockOctokitRest.apps.createInstallationAccessToken.mockResolvedValue({
        status: 201,
        data,
        headers: {},
        url: '',
      });

      const result = await service.getInstallationToken({
        installationId,
        ocktokitClient: () => new Octokit() as any,
      });
      expect(result).toEqual(data);
    });

    it('should throw error if unable to find Installation ID in GitHub output', async () => {
      mockOctokitRest.apps.createInstallationAccessToken.mockResolvedValue({
        status: 201,
        data: {
          expires_at: '2017-07-08T16:18:44-04:00',
          permissions: {},
          repository_selection: 'selected',
        },
        headers: {},
        url: '',
      });

      await expect(
        service.getInstallationToken({
          installationId,
          ocktokitClient: () => new Octokit() as any,
        }),
      ).rejects.toThrow(DataError);
    });

    it('should throw error if GitHub API has an error', async () => {
      mockOctokitRest.apps.createInstallationAccessToken.mockResolvedValue({
        status: 401,
        data: 'Invalid token',
        headers: { 'content-type': 'text/plain' },
        url: '',
      });

      await expect(
        service.getInstallationToken({
          installationId,
          ocktokitClient: () => new Octokit() as any,
        }),
      ).rejects.toThrow(GitHubError);
    });
  });

  describe('getAuthenticatedApp', () => {
    const id = 1234;
    const name = 'foo';
    const output = { id, name };

    it('should return id and name if able to get GitHub output', async () => {
      mockOctokitRest.apps.getAuthenticated.mockResolvedValue({
        status: 201,
        data: output,
        headers: {},
        url: '',
      });

      const result = await service.getAuthenticatedApp({
        ocktokitClient: () => new Octokit() as any,
      });
      expect(result).toEqual(output);
    });

    it('should throw error if unable to find id or name in GitHub output', async () => {
      mockOctokitRest.apps.getAuthenticated.mockResolvedValue({
        status: 201,
        data: {
          expires_at: '2017-07-08T16:18:44-04:00',
          permissions: {},
          repository_selection: 'selected',
        },
        headers: {},
        url: '',
      });

      await expect(
        service.getAuthenticatedApp({
          ocktokitClient: () => new Octokit() as any,
        }),
      ).rejects.toThrow(DataError);
    });

    it('should throw error if GitHub API has an error', async () => {
      mockOctokitRest.apps.getAuthenticated.mockResolvedValue({
        status: 401,
        data: 'Invalid token',
        headers: { 'content-type': 'text/plain' },
        url: '',
      });

      await expect(
        service.getAuthenticatedApp({
          ocktokitClient: () => new Octokit() as any,
        }),
      ).rejects.toThrow(GitHubError);
    });
  });
});
