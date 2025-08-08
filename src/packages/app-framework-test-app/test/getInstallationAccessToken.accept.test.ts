import * as fs from 'fs';
import {
  AppFrameworkClient,
  GetInstallationTokenCommand,
} from '@aws/app-framework-for-github-apps-on-aws-client';
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
/**
 @group accept
 */
describe('Smithy client for installation access token API', () => {
  let endpoint: string;
  let region: string;
  const validAppId = Number(process.env.GITHUB_APPID);
  const validNodeId = process.env.GITHUB_NODEID;
  beforeAll(() => {
    const outputPath = './cdk-output.json';
    if (!fs.existsSync(outputPath)) {
      throw new Error(`
            Can not find cdk-output.json file.
            To run acceptance tests,
            please get the Installation Access Token endpoint from deployed Credential Manager Component:

            Run 'npx projen deploy --outputs-file ./cdk-output.json'

            Then run the tests again with:
            npm run accept
      `);
    }
    const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    endpoint =
      output['the-app-framework-test-stack'].InstallationAccessTokenEndpoint;
    region = output['the-app-framework-test-stack'].Region;
    if (!endpoint) {
      throw new Error(
        `Invalid or missing endpoint in cdk-output.json: ${JSON.stringify(endpoint)}`,
      );
    }
    if (!validAppId || !validNodeId) {
      throw new Error(`
            Missing required environment variables.
            To run acceptance tests, please set the following environment variables:

            export GITHUB_APPID=<your-github-app-id>
            export GITHUB_NODEID=<your-github-node-id>

            Current values:
            APPID: ${validAppId ? validAppId : 'NOT_SET'}
            NODEID: ${validNodeId ? validNodeId : 'NOT_SET'}

            Then run the tests again with:
            npm run accept
        `);
    }
  });
  it('should return a valid installation access token for a valid appId and nodeId', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: validAppId,
      nodeId: validNodeId,
    });
    const response = await client.send(command);
    expect(response).toHaveProperty('appId');
    expect(typeof response.appId).toBe('number');
    expect(response).toHaveProperty('nodeId');
    expect(typeof response.nodeId).toBe('string');
    expect(response).toHaveProperty('installationToken');
    expect(typeof response.installationToken).toBe('string');
    expect(response).toHaveProperty('expirationTime');
  });
  it('should return a validation error for appId=0', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    await expect(
      client.send(
        new GetInstallationTokenCommand({ appId: 0, nodeId: validNodeId }),
      ),
    ).rejects.toThrow(
      "1 validation error detected. Value at '/appId' failed to satisfy constraint: Member must be greater than or equal to 1",
    );
  });
  it('should return a validation error for nodeId is an empty string', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    await expect(
      client.send(
        new GetInstallationTokenCommand({ appId: validAppId, nodeId: '' }),
      ),
    ).rejects.toThrow(
      "1 validation error detected. Value with length 0 at '/nodeId' failed to satisfy constraint: Member must have length between 1 and 256, inclusive",
    );
  });
  it('should return a validation error when nodeId is an empty string and appId=0', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    await expect(
      client.send(new GetInstallationTokenCommand({ appId: 0, nodeId: '' })),
    ).rejects.toThrow(
      "2 validation errors at 2 paths detected. First failure: Value at '/appId' failed to satisfy constraint: Member must be greater than or equal to 1",
    );
  });
  it('should return a not found error for a non-existent appId', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: 9999999,
      nodeId: validNodeId,
    });
    await expect(client.send(command)).rejects.toThrow(
      'Invalid Request: Error: Item not found',
    );
  });
  it('should return a not found error for a non-existent nodeId', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: validAppId,
      nodeId: 'Some-random',
    });
    await expect(client.send(command)).rejects.toThrow(
      `Invalid Request: Error: Installation not found in response for app Id: ${validAppId} and target: Some-random`,
    );
  });
  it('should return a not found error for a non-existent nodeId and appId', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: 9999999,
      nodeId: 'Some-random',
    });
    await expect(client.send(command)).rejects.toThrow(
      'Invalid Request: Error: Item not found',
    );
  });
  it('should fail if credentials are missing', async () => {
    const missingCredentialsProvider = async () => {
      throw new Error('Missing credentials');
    };
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: missingCredentialsProvider,
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: 1161167,
      nodeId: 'Some-random',
    });
    await expect(client.send(command)).rejects.toThrow('Missing credentials');
  });

  it('should return requestedScopeDown and actualScopeDown fields when scoping is requested', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: validAppId,
      nodeId: validNodeId,
      scopeDown: {
        permissions: { metadata: 'read' }, // metadata is always available
      },
    });
    const response = await client.send(command);
    expect(response).toHaveProperty('requestedScopeDown');
    expect(response).toHaveProperty('actualScopeDown');
    expect(response.requestedScopeDown).toEqual({
      permissions: { metadata: 'read' },
    });
    expect(response.actualScopeDown).toBeDefined();
    expect(response.actualScopeDown).toEqual(response.requestedScopeDown);
  });

  it('should return undefined requestedScopeDown when no scoping is requested', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: validAppId,
      nodeId: validNodeId,
    });
    const response = await client.send(command);
    expect(response.requestedScopeDown).toBeUndefined();
    expect(response.actualScopeDown).toBeDefined();
    expect(response.actualScopeDown).toMatchObject({
      permissions: { metadata: 'read' },
    });
  });

  it('should throw error when requesting permissions not granted to the app', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: validAppId,
      nodeId: validNodeId,
      scopeDown: {
        permissions: {
          xyz: 'write',
        },
      },
    });
    await expect(client.send(command)).rejects.toThrow(
      'Invalid Request: Error: GitHub API Request Error: The permissions requested are not granted to this installation. - https://docs.github.com/rest/reference/apps#create-an-installation-access-token-for-an-app',
    );
  });

  it.each([
    [
      'repository names',
      { repositoryNames: ['nonexistent-repo', 'appnotinstalledrepo'] }
    ],
    [
      'repository IDs', 
      { repositoryIds: [999999999] }
    ],
    [
      'repository names and IDs',
      { repositoryNames: ['nonexistent-repo'], repositoryIds: [999999999] }
    ]
  ])('should throw error when requested %s do not exist or app not installed', async (_:string, scopeDown) => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: validAppId,
      nodeId: validNodeId,
      scopeDown,
    });
    await expect(client.send(command)).rejects.toThrow(
      'Invalid Request: Error: GitHub API Request Error: There is at least one repository that does not exist or is not accessible to the parent installation. - https://docs.github.com/rest/reference/apps#create-an-installation-access-token-for-an-app',
    );
  });

  it("should throw error when repository ID is invalid", async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: validAppId,
      nodeId: validNodeId,
      scopeDown: {
        repositoryIds: [2753] 
      },
    });
    await expect(client.send(command)).rejects.toThrow(
      'Invalid Request: Error: GitHub API Request Error: No repositories were provided. - https://docs.github.com/rest/reference/apps#create-an-installation-access-token-for-an-app',
    );
  })

  it('should throw error when requesting invalid permission values', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetInstallationTokenCommand({
      appId: validAppId,
      nodeId: validNodeId,
      scopeDown: {
        permissions: {
          issues: 'invalid',
        },
      },
    });
    await expect(client.send(command)).rejects.toThrow(
      'Invalid Request: Error: GitHub API Request Error: There is at least one permission action that is not supported. It should be one of: \"read\", \"write\" or \"admin\". - https://docs.github.com/rest/reference/apps#create-an-installation-access-token-for-an-app',
    );
  });

});
