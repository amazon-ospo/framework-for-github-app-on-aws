import { createHash } from 'crypto';
import { KMSClient, SignCommand, SignCommandOutput } from '@aws-sdk/client-kms';
import { mockClient } from 'aws-sdk-client-mock';
import {
  getAppTokenImpl,
  validateAppTokenImpl,
  kmsSignImpl,
} from '../../src/credential-manager/get-app-token/getAppToken';
import { GitHubError } from '../../src/error';

//TODO: Remove mock after Jest is able to build properly with Octokit
const mockGetInstallations = jest.fn();
const mockGetInstallationToken = jest.fn();
const mockGetAuthenticatedApp = jest.fn();
jest.mock('../../src/gitHubService', () => {
  return {
    GitHubAPIService: jest.fn().mockImplementation(() => ({
      getInstallations: mockGetInstallations,
      getInstallationToken: mockGetInstallationToken,
      getAuthenticatedApp: mockGetAuthenticatedApp,
    })),
  };
});
const mockKmsClient = mockClient(KMSClient);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('kmsSignImpl', () => {
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const mockMessage = 'testMessage';
  const mockSignature = Buffer.from('mock-signature');
  const expectedMessageHash = createHash('sha256').update(mockMessage).digest();
  it('should return a valid signature when signing a message with a valid KMS key', async () => {
    const mockSignResponse: SignCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      Signature: new Uint8Array(mockSignature),
    };
    mockKmsClient.on(SignCommand).resolves(mockSignResponse);
    const signature = await kmsSignImpl({
      appKeyArn: mockAppKeyArn,
      message: mockMessage,
    });
    expect(signature).toEqual(mockSignature);
    const signCommandCalls = mockKmsClient.commandCalls(SignCommand);
    expect(signCommandCalls).toHaveLength(1);
    const signCommandInput = signCommandCalls[0].args[0].input;
    expect(signCommandInput).toEqual({
      KeyId: mockAppKeyArn,
      Message: expectedMessageHash,
      MessageType: 'DIGEST',
      SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
    });
  });
  it('should throw an error when KMS returns no signature', async () => {
    const mockSignResponse: SignCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
    };
    mockKmsClient.on(SignCommand).resolves(mockSignResponse);
    await expect(
      kmsSignImpl({
        appKeyArn: mockAppKeyArn,
        message: mockMessage,
      }),
    ).rejects.toThrow('KMS signing failed: Signature is missing or empty');
  });
  it('should throw an error when KMS service fails', async () => {
    mockKmsClient.on(SignCommand).rejects(new Error('KMS Failure'));
    await expect(
      kmsSignImpl({
        appKeyArn: mockAppKeyArn,
        message: mockMessage,
      }),
    ).rejects.toThrow('KMS Failure');
  });
});
describe('validateAppTokenImpl', () => {
  it('should succeed if GitHub API validates the App Token successfully', async () => {
    mockGetAuthenticatedApp.mockResolvedValue({ id: 12345, name: 'Test App' });
    await expect(
      validateAppTokenImpl({
        appId: 12345,
        appToken: 'valid.app.token',
      }),
    ).resolves.toBeUndefined();
  });
  it('should throw if the GitHub App ID does not match', async () => {
    mockGetAuthenticatedApp.mockResolvedValue({ id: 54321, name: 'Wrong App' });
    await expect(
      validateAppTokenImpl({
        appId: 12345,
        appToken: 'valid.app.token',
      }),
    ).rejects.toThrow('App ID mismatch: Expected 12345, got 54321');
  });
  it('should throw if the GitHub API returns an error', async () => {
    mockGetAuthenticatedApp.mockRejectedValueOnce(
      new GitHubError(
        'GitHub API Error: status: 401, statusText: Unauthorized, error: Invalid token',
      ),
    );
    await expect(
      validateAppTokenImpl({
        appId: 12345,
        appToken: 'invalid.app.token',
      }),
    ).rejects.toThrow(
      'GitHub API Error: status: 401, statusText: Unauthorized, error: Invalid token',
    );
  });
  it('should throw if the GitHub API call fails', async () => {
    mockGetAuthenticatedApp.mockRejectedValueOnce(
      new Error('GitHub Network error'),
    );
    await expect(
      validateAppTokenImpl({
        appId: 12345,
        appToken: 'valid.app.token',
      }),
    ).rejects.toThrow(
      'App token Authentication Failed: Error: GitHub Network error',
    );
  });
});
describe('getAppTokenImpl', () => {
  const mockAppId = 12345;
  const mockTableName = 'TestTable';
  const mockArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const mockSignature = Buffer.from('mock-signature');
  it('should successfully generate an App token', async () => {
    const mockGetArn = jest.fn().mockResolvedValue(mockArn);
    const mockKmsSign = jest.fn().mockResolvedValue(mockSignature);
    const mockValidateAppToken = jest.fn().mockResolvedValue(undefined);
    const result = await getAppTokenImpl({
      appId: mockAppId,
      tableName: mockTableName,
      getAppKeyArnbyId: mockGetArn,
      kmsSign: mockKmsSign,
      validateAppToken: mockValidateAppToken,
    });
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
    expect(mockGetArn).toHaveBeenCalledWith({
      appId: mockAppId,
      tableName: mockTableName,
    });
    expect(mockKmsSign).toHaveBeenCalledWith({
      appKeyArn: mockArn,
      message: expect.any(String),
    });
    expect(mockValidateAppToken).toHaveBeenCalledWith({
      appId: mockAppId,
      appToken: expect.any(String),
    });
  });
  it('should throw an error when App token validation fails', async () => {
    const mockGetArn = jest.fn().mockResolvedValue(mockArn);
    const mockKmsSign = jest.fn().mockResolvedValue(mockSignature);
    const mockValidateAppToken = jest
      .fn()
      .mockRejectedValue(new Error('Validation Failed'));
    await expect(
      getAppTokenImpl({
        appId: mockAppId,
        tableName: mockTableName,
        getAppKeyArnbyId: mockGetArn,
        kmsSign: mockKmsSign,
        validateAppToken: mockValidateAppToken,
      }),
    ).rejects.toThrow('Failed to generate App token');
  });
  it('should throw an error when KMS signing fails', async () => {
    const mockGetArn = jest.fn().mockResolvedValue(mockArn);
    const mockKmsSign = jest
      .fn()
      .mockRejectedValue(new Error('Signing Failed'));
    const mockValidateAppToken = jest.fn();
    await expect(
      getAppTokenImpl({
        appId: mockAppId,
        tableName: mockTableName,
        getAppKeyArnbyId: mockGetArn,
        kmsSign: mockKmsSign,
        validateAppToken: mockValidateAppToken,
      }),
    ).rejects.toThrow('Failed to generate App token');
  });
  it('should throw an error when getAppKeyArnbyId fails', async () => {
    const mockGetArn = jest.fn().mockRejectedValue(new Error('DynamoDB error'));
    const mockKmsSign = jest.fn();
    const mockValidateAppToken = jest.fn();
    await expect(
      getAppTokenImpl({
        appId: mockAppId,
        tableName: mockTableName,
        getAppKeyArnbyId: mockGetArn,
        kmsSign: mockKmsSign,
        validateAppToken: mockValidateAppToken,
      }),
    ).rejects.toThrow('Failed to generate App token');
  });
  it('should throw an error when validateAppToken throws an error', async () => {
    const mockGetArn = jest.fn().mockResolvedValue(mockArn);
    const mockKmsSign = jest.fn().mockResolvedValue(mockSignature);
    const mockValidateAppToken = jest
      .fn()
      .mockRejectedValue(new Error('Validation Failed'));
    await expect(
      getAppTokenImpl({
        appId: mockAppId,
        tableName: mockTableName,
        getAppKeyArnbyId: mockGetArn,
        kmsSign: mockKmsSign,
        validateAppToken: mockValidateAppToken,
      }),
    ).rejects.toThrow('Failed to generate App token');
  });
});
