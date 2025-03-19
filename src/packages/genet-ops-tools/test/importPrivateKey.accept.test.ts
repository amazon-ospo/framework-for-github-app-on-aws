import { existsSync, unlinkSync } from 'fs';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import {
  DescribeKeyCommand,
  KMSClient,
  ListResourceTagsCommand,
} from '@aws-sdk/client-kms';
import { importPrivateKey } from '../src/importPrivateKey';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  unlinkSync: jest.fn(),
}));

// To permanently delete the PEM file after execution of all tests
const realUnlinkSync = jest.requireActual('fs').unlinkSync;

/**
 * Acceptance Test for `importPrivateKey.ts`
 * This test suite performs end-to-end testing of the GitHub App private key import functionality
 * against real AWS and GitHub resources. It validates the complete workflow from importing a
 * private key to using it for JWT signing.
 *
 * Please follow the pre-requisite setup steps before running these tests.
 * IMPORTANT: These tests interact with live AWS services and will:
 * - Create AWS resources (which may incur costs)
 * - Store data in DynamoDB
 * - Make calls to GitHub's API
 * - Perform cryptographic operations
 * - Delete the PEM file after successful import
 *
 * Prerequisites:
 * 1. Install a GitHub App and download the private key which is a file in PEM format
 * 2. Keep a track of the file location for the import process
 * 3. Ensure you have AWS credentials configured
 *
 * Running the tests:
 * 1. This test suite contains acceptance tests of importPrivateKey.ts.
 * 2. Before running acceptance tests:
 * 3. Set up PEM file path, GitHub App ID and Table name as environment variables to pass the tests
 *    or tests fail.
 * 4. For Table name run the below command, and pick the table name from the list displayed
 *    ```
 *     npm run get-table-name
 *    ```
 * 5. Set up required environment variables:
 *    ```
 *    export GITHUB_PEM_FILE_PATH=<path-to-your-private-key.pem>
 *    export GITHUB_APPID=<your-github-app-id>
 *    export DYNAMODB_TABLE_NAME=<your-dynamo-table-name>
 *    ```
 *    NOTE: Get the DYNAMODB_TABLE_NAME from npm run get-table-name
 * 6. Run the acceptance tests:
 *    ```
 *    npm run accept
 *    ```
 * 7. On first run, if the importPrivateKey.ts acceptance tests fail,
 *    recheck if the environment variables are set correctly.
 * 8. After Successful test completion:
 *    - Manually delete the created AWS KMS keys if necessary
 *    - Old KMS keys are automatically scheduled for deletion
 *    - The PEM file will be automatically deleted for security
 */

/**
 * @group accept
 */
describe('importPrivateKey Acceptance Tests', () => {
  let kmsClient: KMSClient;
  let createdKeyArn: string | null = null;
  let dynamoClient: DynamoDBClient;
  const invalidTableName = 'invalidTableName';
  const invalidPrivateKeyPath = './invalidPEMPath.pem';
  const invalidAppId = 'invalidAppID';
  const pemFile = process.env.GITHUB_PEM_FILE_PATH!;
  const appId = process.env.GITHUB_APPID ?? '';
  const tableName = process.env.DYNAMODB_TABLE_NAME ?? '';
  const mockUnlinkFileSync = unlinkSync as jest.Mock;

  beforeEach(() => {
    if (!pemFile || !appId || !tableName) {
      throw new Error(`
            Missing required environment variables

            To run acceptance tests, please set the following environment variables:
            Pick DYNAMODB_TABLE_NAME value from the test run from getTable.accept.test.ts

            export GITHUB_PEM_FILE_PATH=<path-to-your-private-key.pem>
            export GITHUB_APPID=<your-github-app-id>
            export DYNAMODB_TABLE_NAME=<your-dynamo-table-name>

            Current values:
            PEM_FILE_PATH: ${pemFile ? pemFile : 'NOT_SET'}
            APPID: ${appId ? appId : 'NOT_SET'}
            TABLE_NAME: ${tableName ? tableName : 'NOT_SET'}

            Then run the tests again with:
            npm run accept
        `);
    }
    if (!existsSync(pemFile)) {
      throw new Error(`
            PEM file not found at: ${pemFile}

            Please ensure:
            1. The GITHUB_PEM_FILE_PATH environment variable points to a valid .pem file
            2. The file exists and is in a valid path.
        `);
    }
    if (!pemFile.endsWith('.pem')) {
      throw new Error(`
            Invalid PEM file: ${pemFile}
            The GITHUB_PEM_FILE_PATH must point to a .pem file
        `);
    }
    mockUnlinkFileSync.mockImplementation((path) => {
      console.log(`Skipping deletion of ${path} during tests`);
    });
    kmsClient = new KMSClient({});
    dynamoClient = new DynamoDBClient({});
  });

  afterAll(async () => {
    if (createdKeyArn) {
      console.log(`
        You should manually delete the imported AWS KMS key: ${createdKeyArn} \n
        Upon rotation, imported old keys are automatically scheduled for deletion`);
    }
    jest.clearAllMocks();
    if (existsSync(pemFile)) {
      realUnlinkSync(pemFile);
      console.log('PEM file deleted after all tests completed');
    }
  });

  it('should successfully import private key and store in AWS KMS', async () => {
    await importPrivateKey({
      pemFilePath: pemFile,
      appId: appId,
      tableName,
    });
    const getItemResponse = await dynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          AppId: { S: appId },
        },
      }),
    );
    createdKeyArn = getItemResponse.Item?.KmsKeyArn?.S || null;
    expect(getItemResponse.Item).toBeDefined();
    expect(createdKeyArn).toBeDefined();
    expect(getItemResponse.Item?.AppId.S).toBe(appId);
  });

  it('should handle key rotation and successfully import the updated private key into AWS KMS ', async () => {
    // First import key ARN
    const existingKeyResponse = await dynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          AppId: { S: appId },
        },
      }),
    );
    const existingKeyArn = existingKeyResponse.Item?.KmsKeyArn?.S;
    // Rotation
    await importPrivateKey({
      pemFilePath: pemFile,
      appId: appId,
      tableName,
    });
    const newKeyResponse = await dynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          AppId: { S: appId },
        },
      }),
    );

    createdKeyArn = newKeyResponse.Item?.KmsKeyArn?.S || null;
    expect(createdKeyArn).toBeDefined();
    // Handling old key - Tagging and scheduling for deletion
    if (existingKeyArn) {
      const tagsResponse = await kmsClient.send(
        new ListResourceTagsCommand({ KeyId: existingKeyArn }),
      );
      expect(tagsResponse.Tags).toEqual(
        expect.arrayContaining([
          { TagKey: 'Status', TagValue: 'Inactive' },
          { TagKey: 'ReplacedBy', TagValue: createdKeyArn },
          { TagKey: 'ReplacedOn', TagValue: expect.any(String) },
          { TagKey: 'AppId', TagValue: appId },
          { TagKey: 'Genet-Managed', TagValue: 'true' },
        ]),
      );
      const describeResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: existingKeyArn }),
      );
      expect(describeResponse.KeyMetadata?.KeyState).toBe('PendingDeletion');
      expect(describeResponse.KeyMetadata?.DeletionDate).toBeDefined();
    }
    // Verify new key Tags
    const newKeyTags = await kmsClient.send(
      new ListResourceTagsCommand({ KeyId: createdKeyArn! }),
    );

    expect(newKeyTags.Tags).toEqual(
      expect.arrayContaining([
        { TagKey: 'Status', TagValue: 'Active' },
        { TagKey: 'AppId', TagValue: appId },
        { TagKey: 'Genet-Managed', TagValue: 'true' },
      ]),
    );
  });

  it.each([
    [
      'should throw error when importing with an invalid private key',
      invalidPrivateKeyPath,
      appId,
      tableName,
      'File not found at the path:',
    ],
    [
      'should throw error when importing with an invalid appId',
      pemFile,
      invalidAppId,
      tableName,
      'GitHub authentication failed - invalid private key or App ID mismatch',
    ],
    [
      'should throw error when importing with an invalid tableName',
      pemFile,
      appId,
      invalidTableName,
      'Invalid table name provided. Table \"invalidTableName\" is not in the list of tables',
    ],
  ])(
    '%s',
    async (_: string, testPemFile, testAppId, testTableName, expectedError) => {
      await expect(
        importPrivateKey({
          pemFilePath: testPemFile,
          appId: testAppId,
          tableName: testTableName,
        }),
      ).rejects.toThrow(expectedError);
    },
  );

  it('should fail when imported private key fails JWT authentication', async () => {
    const mockFetch = jest.spyOn(global, 'fetch');
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: appId,
          name: 'test-app',
        }),
        {
          status: 200,
          headers: new Headers({
            'content-type': 'application/json',
          }),
        },
      ),
    );
    mockFetch.mockResolvedValueOnce(
      new Response('Invalid token', {
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({
          'content-type': 'text/plain',
        }),
      }),
    );
    await expect(
      importPrivateKey({
        pemFilePath: pemFile,
        appId,
        tableName,
      }),
    ).rejects.toThrow(
      'Key material import successful but JWT authentication failed',
    );
  });
});
