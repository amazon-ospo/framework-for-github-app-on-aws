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

    // Pagination tests with Link header
    it('should handle pagination using Link header with rel="next"', async () => {
      // Create test data for multiple pages
      const page1Installations = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        account: { node_id: `node_${i + 1}` },
        app_id: 1010,
      }));

      const page2Installations = Array.from({ length: 100 }, (_, i) => ({
        id: i + 101,
        account: { node_id: `node_${i + 101}` },
        app_id: 1010,
      }));

      const page3Installations = Array.from({ length: 50 }, (_, i) => ({
        id: i + 201,
        account: { node_id: `node_${i + 201}` },
        app_id: 1010,
      }));

      // Mock the API calls for each page with Link headers
      mockOctokitRest.apps.listInstallations
        .mockResolvedValueOnce({
          status: 200,
          data: page1Installations,
          headers: {
            link: '<https://api.github.com/app/installations?page=2>; rel="next", <https://api.github.com/app/installations?page=3>; rel="last"',
          },
          url: '',
        })
        .mockResolvedValueOnce({
          status: 200,
          data: page2Installations,
          headers: {
            link: '<https://api.github.com/app/installations?page=3>; rel="next", <https://api.github.com/app/installations?page=1>; rel="prev"',
          },
          url: '',
        })
        .mockResolvedValueOnce({
          status: 200,
          data: page3Installations,
          headers: {
            link: '<https://api.github.com/app/installations?page=2>; rel="prev", <https://api.github.com/app/installations?page=1>; rel="first"',
          },
          url: '',
        });

      const result = await service.getInstallations({
        ocktokitClient: () => new Octokit() as any,
      });

      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledTimes(3);
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenNthCalledWith(
        1,
        {
          per_page: 100,
          page: 1,
        },
      );
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenNthCalledWith(
        2,
        {
          per_page: 100,
          page: 2,
        },
      );
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenNthCalledWith(
        3,
        {
          per_page: 100,
          page: 3,
        },
      );

      // Should return all installations from all pages
      const expectedResult = [
        ...page1Installations,
        ...page2Installations,
        ...page3Installations,
      ];
      expect(result).toEqual(expectedResult);
      expect(result).toHaveLength(250);
    });

    it('should handle single page with less than 100 installations', async () => {
      const installations = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        account: { node_id: `node_${i + 1}` },
        app_id: 1010,
      }));

      mockOctokitRest.apps.listInstallations.mockResolvedValueOnce({
        status: 200,
        data: installations,
        headers: {
          link: '<https://api.github.com/app/installations?page=1>; rel="prev", <https://api.github.com/app/installations?page=1>; rel="first"',
        },
        url: '',
      });

      const result = await service.getInstallations({
        ocktokitClient: () => new Octokit() as any,
      });

      // Should only call the API once since we got less than 100 results
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledTimes(1);
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledWith({
        per_page: 100,
        page: 1,
      });

      expect(result).toEqual(installations);
      expect(result).toHaveLength(25);
    });

    it('should handle exactly 100 installations on first page', async () => {
      const page1Installations = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        account: { node_id: `node_${i + 1}` },
        app_id: 1010,
      }));

      mockOctokitRest.apps.listInstallations.mockResolvedValueOnce({
        status: 200,
        data: page1Installations,
        headers: {
          link: '<https://api.github.com/app/installations?page=1>; rel="first", <https://api.github.com/app/installations?page=1>; rel="last"',
        },
        url: '',
      });

      const result = await service.getInstallations({
        ocktokitClient: () => new Octokit() as any,
      });

      // Should call the API only once since Link header has no rel="next"
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledTimes(1);
      expect(result).toEqual(page1Installations);
      expect(result).toHaveLength(100);
    });

    it('should throw error if any page returns an error status', async () => {
      const page1Installations = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        account: { node_id: `node_${i + 1}` },
        app_id: 1010,
      }));

      mockOctokitRest.apps.listInstallations
        .mockResolvedValueOnce({
          status: 200,
          data: page1Installations,
          headers: {
            link: '<https://api.github.com/app/installations?page=2>; rel="next"',
          },
          url: '',
        })
        .mockResolvedValueOnce({
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

      // Should have called the API twice before failing
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledTimes(2);
    });

    it('should handle empty installations list', async () => {
      mockOctokitRest.apps.listInstallations.mockResolvedValueOnce({
        status: 200,
        data: [],
        headers: {},
        url: '',
      });

      const result = await service.getInstallations({
        ocktokitClient: () => new Octokit() as any,
      });

      // Should only call the API once since we got 0 results
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledTimes(1);
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledWith({
        per_page: 100,
        page: 1,
      });

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should stop pagination when Link header has no rel="next"', async () => {
      const installations = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        account: { node_id: `node_${i + 1}` },
        app_id: 1010,
      }));

      mockOctokitRest.apps.listInstallations.mockResolvedValueOnce({
        status: 200,
        data: installations,
        headers: {
          link: '<https://api.github.com/app/installations?page=1>; rel="prev", <https://api.github.com/app/installations?page=1>; rel="first"',
        },
        url: '',
      });

      const result = await service.getInstallations({
        ocktokitClient: () => new Octokit() as any,
      });

      // Should only call the API once since Link header doesn't contain rel="next"
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledTimes(1);
      expect(result).toEqual(installations);
      expect(result).toHaveLength(100);
    });

    it('should handle Link header with rel="next"', async () => {
      const page1Installations = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        account: { node_id: `node_${i + 1}` },
        app_id: 1010,
      }));

      const page2Installations = Array.from({ length: 30 }, (_, i) => ({
        id: i + 51,
        account: { node_id: `node_${i + 51}` },
        app_id: 1010,
      }));

      mockOctokitRest.apps.listInstallations
        .mockResolvedValueOnce({
          status: 200,
          data: page1Installations,
          headers: {
            link: '<https://api.github.com/app/installations?page=2>; rel="next"',
          },
          url: '',
        })
        .mockResolvedValueOnce({
          status: 200,
          data: page2Installations,
          headers: {},
          url: '',
        });

      const result = await service.getInstallations({
        ocktokitClient: () => new Octokit() as any,
      });

      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledTimes(2);
      expect(result).toEqual([...page1Installations, ...page2Installations]);
      expect(result).toHaveLength(80);
    });

    it('should handle undefined Link header', async () => {
      const installations = Array.from({ length: 75 }, (_, i) => ({
        id: i + 1,
        account: { node_id: `node_${i + 1}` },
        app_id: 1010,
      }));

      mockOctokitRest.apps.listInstallations.mockResolvedValueOnce({
        status: 200,
        data: installations,
        headers: {
          link: undefined,
        },
        url: '',
      });

      const result = await service.getInstallations({
        ocktokitClient: () => new Octokit() as any,
      });

      // Should only call the API once since undefined Link header evaluates to falsy
      expect(mockOctokitRest.apps.listInstallations).toHaveBeenCalledTimes(1);
      expect(result).toEqual(installations);
      expect(result).toHaveLength(75);
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
