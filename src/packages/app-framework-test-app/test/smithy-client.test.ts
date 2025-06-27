import {
  AppFrameworkClient,
  GetAppTokenCommand,
} from '@aws/app-framework-client';
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

// This test is skipped by default;
// we need to wire in the Lambda function endpoint
// which will likely differ for every AppFramework user.
test.skip('Smithy client for app token API', async () => {
  const client = new AppFrameworkClient({
    // Update here.
    endpoint:
      'https://your-credential-manager-lambda-function-endpoint.lambda-url.us-west-2.on.aws/',
    region: 'us-west-2',
    credentials: defaultProvider(),
    sha256: Sha256,
  });
  // Update here.
  const command = new GetAppTokenCommand({ appId: 123456 });
  await client.send(command);
});
