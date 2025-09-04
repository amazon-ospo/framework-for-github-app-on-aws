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
  rateLimit: {
    get: jest.fn<MockOctokitResponse<any>, [any]>(),
  },
};

const mockPaginate = jest.fn();

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: mockOctokitRest,
    paginate: mockPaginate,
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
      const expectedInstallations = [
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

      mockPaginate.mockResolvedValue(expectedInstallations);

      const result = await service.getInstallations({
        octokitClient: () => new Octokit() as any,
      });

      expect(mockPaginate).toHaveBeenCalledWith(
        mockOctokitRest.apps.listInstallations,
        { per_page: 100 },
      );
      expect(result).toEqual(expectedInstallations);
    });

    it('should return empty array when no installations found', async () => {
      mockPaginate.mockResolvedValue([]);

      const result = await service.getInstallations({
        octokitClient: () => new Octokit() as any,
      });

      expect(mockPaginate).toHaveBeenCalledWith(
        mockOctokitRest.apps.listInstallations,
        { per_page: 100 },
      );
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple pages automatically with octokit.paginate', async () => {
      const expectedInstallations = Array.from({ length: 250 }, (_, i) => ({
        id: i + 1,
        account: { node_id: `node_${i + 1}` },
        app_id: 1010,
      }));

      mockPaginate.mockResolvedValue(expectedInstallations);

      const result = await service.getInstallations({
        octokitClient: () => new Octokit() as any,
      });

      expect(mockPaginate).toHaveBeenCalledWith(
        mockOctokitRest.apps.listInstallations,
        { per_page: 100 },
      );
      expect(result).toEqual(expectedInstallations);
      expect(result).toHaveLength(250);
    });

    it('should throw GitHubError when paginate throws HTTP error', async () => {
      const httpError = {
        status: 401,
        response: {
          status: 401,
          headers: { 'content-type': 'application/json' },
          data: { message: 'Bad credentials' },
        },
        message: 'Bad credentials',
      };

      mockPaginate.mockRejectedValue(httpError);

      await expect(
        service.getInstallations({
          octokitClient: () => new Octokit() as any,
        }),
      ).rejects.toThrow(GitHubError);

      await expect(
        service.getInstallations({
          octokitClient: () => new Octokit() as any,
        }),
      ).rejects.toThrow('GitHub API Error: status: 401');
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

  describe('getRateLimit', () => {
    const output = {
      resources: {
        core: {
          limit: 5000,
          used: 1,
          remaining: 4999,
          reset: 1691591363,
        },
        search: {
          limit: 30,
          used: 12,
          remaining: 18,
          reset: 1691591091,
        },
        graphql: {
          limit: 5000,
          used: 7,
          remaining: 4993,
          reset: 1691593228,
        },
      },
      rate: {
        limit: 5000,
        used: 1,
        remaining: 4999,
        reset: 1372700873,
      },
    };

    it('should return id and name if able to get GitHub output', async () => {
      mockOctokitRest.rateLimit.get.mockResolvedValue({
        status: 201,
        data: output,
        headers: {},
        url: '',
      });

      const result = await service.getRateLimit({
        ocktokitClient: () => new Octokit() as any,
      });
      expect(result).toEqual(output);
    });

    it('should throw error if GitHub API has an error', async () => {
      mockOctokitRest.rateLimit.get.mockResolvedValue({
        status: 401,
        data: 'Invalid token',
        headers: { 'content-type': 'text/plain' },
        url: '',
      });

      await expect(
        service.getRateLimit({
          ocktokitClient: () => new Octokit() as any,
        }),
      ).rejects.toThrow(GitHubError);
    });
  });
  it('should throw error data error if response returned does not have proper values', async () => {
    mockOctokitRest.rateLimit.get.mockResolvedValue({
      status: 201,
      data: null,
      headers: { 'content-type': 'text/plain' },
      url: '',
    });

    await expect(
      service.getRateLimit({
        ocktokitClient: () => new Octokit() as any,
      }),
    ).rejects.toThrow(DataError);
  });
});
