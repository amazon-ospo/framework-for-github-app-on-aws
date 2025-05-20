import * as fs from 'fs';
import {
  AppFrameworkClient,
  GetAppTokenCommand,
} from '@aws/app-framework-client';
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
/**
 @group accept
 */
describe('Smithy client for app token API', () => {
  let endpoint: string;
  let region: string;
  const validAppId = Number(process.env.GITHUB_APPID);
  beforeAll(() => {
    const outputPath = './cdk-output.json';
    if (!fs.existsSync(outputPath)) {
      throw new Error(`
            Can not find cdk-output.json file. 
            To run acceptance tests, 
            please get the App Token endpoint from deployed Credential Manager Component:
      
            Run 'npx projen deploy --outputs-file ./cdk-output.json'
      
            Then run the tests again with:
            npm run accept
      `);
    }
    const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    endpoint = output['the-app-framework-test-stack'].AppTokenEndpoint;
    region = 'us-west-2';
    if (!endpoint) {
      throw new Error(
        `Invalid or missing endpoint in cdk-output.json: ${JSON.stringify(endpoint)}`,
      );
    }
    if (!validAppId) {
      throw new Error(`
            Missing required environment variables.
            To run acceptance tests, please set the following environment variables:
            
            export GITHUB_APPID=<your-github-app-id>

            Current values:
            APPID: ${validAppId ? validAppId : 'NOT_SET'}

            Then run the tests again with:
            npm run accept
        `);
    }
  });
  it('should return a valid app token for a valid appId', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetAppTokenCommand({ appId: validAppId });
    const response = await client.send(command);
    expect(response).toHaveProperty('appId');
    expect(typeof response.appId).toBe('number');
    expect(response).toHaveProperty('appToken');
    expect(typeof response.appToken).toBe('string');
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
      client.send(new GetAppTokenCommand({ appId: 0 })),
    ).rejects.toThrow(
      "1 validation error detected. Value at '/appId' failed to satisfy constraint: Member must be greater than or equal to 1",
    );
  });
  it('should return a not found error for a non-existent appId', async () => {
    const client = new AppFrameworkClient({
      endpoint,
      region,
      credentials: defaultProvider(),
      sha256: Sha256,
    });
    const command = new GetAppTokenCommand({ appId: 9999999 });
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
    const command = new GetAppTokenCommand({ appId: 1161167 });
    await expect(client.send(command)).rejects.toThrow('Missing credentials');
  });
});
