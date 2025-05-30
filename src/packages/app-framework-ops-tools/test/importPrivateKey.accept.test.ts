import { generateKeyPairSync } from 'crypto';
import { copyFileSync, existsSync, mkdtempSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { KMSClient, ListResourceTagsCommand } from '@aws-sdk/client-kms';
import { USER_AGENT } from '../src/constants';
import { importPrivateKey } from '../src/importPrivateKey';

/**
 * @group accept
 */
describe('importPrivateKey Acceptance Tests', () => {
  let kmsClient: KMSClient;
  let createdKeyArn: string | null = null;
  let dynamoClient: DynamoDBClient;
  let tempPemFile: string;
  const invalidTableName = 'invalidTableName';
  const invalidPrivateKeyPath = './invalidPEMPath.pem';
  const invalidAppId = -1;
  const pemFile = process.env.GITHUB_PEM_FILE_PATH!;
  const appIdAsString = process.env.GITHUB_APPID ?? '';
  const appId = Number(appIdAsString);
  const tableName = process.env.DYNAMODB_TABLE_NAME ?? '';

  beforeEach(() => {
    if (!pemFile || !appIdAsString || !tableName) {
      throw new Error(`
            Missing required environment variables

            To run acceptance tests, please set the following environment variables:
            Pick DYNAMODB_TABLE_NAME value from the test run from getTable.accept.test.ts

            export GITHUB_PEM_FILE_PATH=<path-to-your-private-key.pem>
            export GITHUB_APPID=<your-github-app-id>
            export DYNAMODB_TABLE_NAME=<your-dynamo-table-name>

            Current values:
            PEM_FILE_PATH: ${pemFile ? pemFile : 'NOT_SET'}
            APPID: ${appIdAsString ? appIdAsString : 'NOT_SET'}
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
    const tempDir = mkdtempSync(tmpdir());
    tempPemFile = join(tempDir, 'github-private-key.pem');
    copyFileSync(pemFile, tempPemFile);
    kmsClient = new KMSClient({
      customUserAgent: USER_AGENT,
    });
    dynamoClient = new DynamoDBClient({
      customUserAgent: USER_AGENT,
    });
  });
  afterEach(async () => {
    if (existsSync(tempPemFile)) {
      await unlink(tempPemFile);
    }
  });
  afterAll(async () => {
    const absolutePemPath = resolve(pemFile);
    if (existsSync(absolutePemPath)) {
      await unlink(absolutePemPath);
      console.log(`Deleted pem file found at ${absolutePemPath}`);
    }
    if (createdKeyArn) {
      console.log(`
        Upon rotation, imported old keys are tagged as status "Inactive".
        The most recently created KMS key: ${createdKeyArn} remains active and will incur AWS charges. 
        You can manually delete it to avoid ongoing costs if you don't plan to use it further \n`);
    }
    jest.clearAllMocks();
  });

  it('should successfully import private key and store in AWS KMS', async () => {
    await importPrivateKey({
      pemFilePath: tempPemFile,
      appId: appId,
      tableName,
    });
    const getItemResponse = await dynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          AppId: { N: appId.toString() },
        },
      }),
    );
    createdKeyArn = getItemResponse.Item?.KmsKeyArn?.S || null;
    expect(getItemResponse.Item).toBeDefined();
    expect(createdKeyArn).toBeDefined();
    expect(getItemResponse.Item?.AppId.N).toBe(appId.toString());
  });

  it('should handle key rotation and successfully import the updated private key into AWS KMS ', async () => {
    // First import key ARN
    const existingKeyResponse = await dynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          AppId: { N: appId.toString() },
        },
      }),
    );
    const existingKeyArn = existingKeyResponse.Item?.KmsKeyArn?.S;
    // Rotation
    await importPrivateKey({
      pemFilePath: tempPemFile,
      appId: appId,
      tableName,
    });
    const newKeyResponse = await dynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          AppId: { N: appId.toString() },
        },
      }),
    );

    createdKeyArn = newKeyResponse.Item?.KmsKeyArn?.S || null;
    expect(createdKeyArn).toBeDefined();
    // Handling old key - Tagging as "Inactive"
    if (existingKeyArn) {
      const tagsResponse = await kmsClient.send(
        new ListResourceTagsCommand({ KeyId: existingKeyArn }),
      );
      expect(tagsResponse.Tags).toEqual(
        expect.arrayContaining([
          { TagKey: 'Status', TagValue: 'Inactive' },
          { TagKey: 'ReplacedBy', TagValue: createdKeyArn },
          { TagKey: 'ReplacedOn', TagValue: expect.any(String) },
          { TagKey: 'AppId', TagValue: appId.toString() },
          { TagKey: 'FrameworkForGitHubAppOnAwsManaged', TagValue: 'true' },
        ]),
      );
    }
    // Verify new key Tags
    const newKeyTags = await kmsClient.send(
      new ListResourceTagsCommand({ KeyId: createdKeyArn! }),
    );

    expect(newKeyTags.Tags).toEqual(
      expect.arrayContaining([
        { TagKey: 'Status', TagValue: 'Active' },
        { TagKey: 'AppId', TagValue: appId.toString() },
        { TagKey: 'FrameworkForGitHubAppOnAwsManaged', TagValue: 'true' },
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

  it('should fail when using an invalid private key for JWT authentication', async () => {
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    await writeFile(tempPemFile, privateKey);
    await expect(
      importPrivateKey({
        pemFilePath: tempPemFile,
        appId,
        tableName,
      }),
    ).rejects.toThrow(
      'GitHub authentication failed - invalid private key or App ID mismatch',
    );
  });
});
