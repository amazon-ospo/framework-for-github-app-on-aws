import {
  createHash,
  createDecipheriv,
  verify,
  generateKeyPairSync,
  KeyObject,
  createPublicKey,
  privateDecrypt,
  createPrivateKey,
  constants,
  randomBytes,
} from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import {
  CreateKeyCommand,
  CreateKeyCommandOutput,
  DescribeKeyCommand,
  DescribeKeyCommandOutput,
  GetParametersForImportCommand,
  GetParametersForImportCommandOutput,
  ImportKeyMaterialCommand,
  ImportKeyMaterialCommandOutput,
  KeyMetadata,
  KMSClient,
  ScheduleKeyDeletionCommand,
  ScheduleKeyDeletionCommandOutput,
  SignCommand,
  SignCommandOutput,
  TagResourceCommand,
  TagResourceCommandOutput,
} from '@aws-sdk/client-kms';
import { mockClient } from 'aws-sdk-client-mock';
// import mockFs from 'mock-fs';
import {
  CREATE_KEY_SPEC,
  WRAPPING_SPEC,
  SCHEDULE_OLD_KEY_DELETION_DAYS,
} from '../src/constants';
import {
  createKmsKeyImpl,
  updateAppsTableImpl,
  scheduleOldKeyDeletionImpl,
  tagOldKeyArnImpl,
  handleOldKeyImpl,
  validateJWTImpl,
  kmsSignImpl,
  importKeyMaterialAndValidateImpl,
  getKmsImportParametersImpl,
  wrapKeyMaterialImpl,
  validateInputsImpl,
  pemSignImpl,
  encryptKeyMaterialImpl,
  convertPemToDerImpl,
  importPrivateKey,
  tagKeyAsFailedImpl,
} from '../src/importPrivateKey';
import * as importKey from '../src/importPrivateKey';
// TODO(jsii): Use ES import once jsii compilation is fixed with mock-fs
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockFs = require('mock-fs');

const mockKmsClient = mockClient(KMSClient);
const mockDynamoDBClient = mockClient(DynamoDBClient);
afterEach(() => {
  mockKmsClient.reset();
  mockDynamoDBClient.reset();
  jest.clearAllMocks();
});
describe('validateInputsImpl', () => {
  let mockValidateJWT = jest.fn();
  let mockListTables = jest.fn();
  const mockPemFilePath = '/path/to/privatekey.pem';
  const mockWrongPrivateKeyPath = '/path/to/wrongPrivateKey.pem';
  const mockAppId = '12345';
  const mockTableName = 'validTable';
  const validPrivateKey =
    '-----BEGIN PRIVATE KEY-----\nvalid-key-content\n-----END PRIVATE KEY-----';
  const invalidPrivateKey = 'invalid-key-content';
  beforeEach(() => {
    jest.resetAllMocks();
    mockFs({
      '/path/to': {
        'privatekey.pem': validPrivateKey,
        'wrongPrivateKey.pem': invalidPrivateKey,
      },
    });
  });
  afterEach(() => {
    mockFs.restore();
  });
  it('should validate inputs successfully when PEM file exists, GitHub authentication succeeds and valid table name is provided', async () => {
    mockValidateJWT.mockResolvedValue(true);
    mockListTables.mockResolvedValue(['validTable', 'otherTable']);

    await validateInputsImpl({
      pemFile: mockPemFilePath,
      appId: mockAppId,
      tableName: mockTableName,
      validateJWt: mockValidateJWT,
      listTables: mockListTables,
    });
    expect(mockValidateJWT).toHaveBeenCalledWith({
      appId: mockAppId,
      signFunction: expect.any(Function),
    });
    expect(mockListTables).toHaveBeenCalled();
  });
  it('should throw error when PEM file does not exist', async () => {
    mockFs({
      '/path/to': {}, // Empty directory
    });
    await expect(
      validateInputsImpl({
        pemFile: mockPemFilePath,
        appId: mockAppId,
        tableName: mockTableName,
      }),
    ).rejects.toThrow(`File not found at the path: ${mockPemFilePath}`);
    expect(mockValidateJWT).not.toHaveBeenCalled();
    expect(mockListTables).not.toHaveBeenCalled();
  });
  it.each([
    [
      'should throw error when GitHub authentication fails due to invalid private key',
      mockWrongPrivateKeyPath,
      mockAppId,
    ],
    [
      'should throw error when GitHub authentication fails due to App ID mismatch',
      mockPemFilePath,
      'invalid-app-id',
    ],
  ])('%s', async (_: string, pemFile, appId) => {
    mockValidateJWT.mockResolvedValue(false);
    await expect(
      validateInputsImpl({
        pemFile,
        appId,
        tableName: mockTableName,
        validateJWt: mockValidateJWT,
        listTables: mockListTables,
      }),
    ).rejects.toThrow(
      'GitHub authentication failed - invalid private key or App ID mismatch',
    );
    expect(mockValidateJWT).toHaveBeenCalledWith({
      appId: appId,
      signFunction: expect.any(Function),
    });
    expect(mockListTables).not.toHaveBeenCalled();
  });
  it('should throw error when provided table name is not in the list of tables', async () => {
    mockValidateJWT.mockResolvedValue(true);
    mockListTables.mockResolvedValue(['validTable', 'otherTable']);

    await expect(
      validateInputsImpl({
        pemFile: mockPemFilePath,
        appId: mockAppId,
        tableName: 'invalid-table',
        validateJWt: mockValidateJWT,
        listTables: mockListTables,
      }),
    ).rejects.toThrow(
      'Invalid table name provided. Table \"invalid-table\" is not in the list of tables',
    );
    expect(mockListTables).toHaveBeenCalled();
  });
  it('should throw error when listTable fails', async () => {
    mockValidateJWT.mockResolvedValue(true);
    mockListTables.mockRejectedValue(new Error('Failed to list tables'));

    await expect(
      validateInputsImpl({
        pemFile: mockPemFilePath,
        appId: mockAppId,
        tableName: mockTableName,
        validateJWt: mockValidateJWT,
        listTables: mockListTables,
      }),
    ).rejects.toThrow('Failed to list tables');
  });
  it('should throw error when GitHub authentication fails due to API error', async () => {
    mockValidateJWT.mockRejectedValue(new Error('GitHub API Error'));
    mockFs({
      '/path/to': {
        'privatekey.pem': validPrivateKey,
      },
    });
    await expect(
      validateInputsImpl({
        pemFile: '/path/to/privatekey.pem',
        appId: mockAppId,
        tableName: mockTableName,
        validateJWt: mockValidateJWT,
        listTables: mockListTables,
      }),
    ).rejects.toThrow('GitHub API Error');
  });
});

describe('convertPemToDerImpl', () => {
  let originalPrivateKeyPem: string;
  let expectedDerBuffer: Buffer;
  const pemFilePath = '/path/to/github-private-key.pem';
  const invalidPemPath = '/path/to/invalidFile.pem';
  const emptyPemPath = '/path/to/empty.pem';
  const nonexistentFile = '/path/to/nonexistent.pem';

  beforeEach(() => {
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    originalPrivateKeyPem = privateKey;
    expectedDerBuffer = createPrivateKey(privateKey).export({
      type: 'pkcs8',
      format: 'der',
    });
    mockFs({
      '/path/to': {
        'github-private-key.pem': originalPrivateKeyPem,
        'invalidFile.pem': 'invalid content',
        'empty.pem': '',
      },
    });
  });
  afterEach(() => {
    mockFs.restore();
  });

  it('should successfully convert a valid PEM to DER format', () => {
    const derBuffer = convertPemToDerImpl({
      pemFile: pemFilePath,
    });
    expect(Buffer.isBuffer(derBuffer)).toBe(true);
    expect(derBuffer).toEqual(expectedDerBuffer);
    const reconstructedKey = createPrivateKey({
      key: derBuffer,
      format: 'der',
      type: 'pkcs8',
    });
    const reconstructedPem = reconstructedKey
      .export({
        type: 'pkcs8',
        format: 'pem',
      })
      .toString();
    expect(reconstructedPem).toEqual(originalPrivateKeyPem);
  });
  it.each([
    [
      'should throw an error when PEM file is not a valid PEM encoding',
      invalidPemPath,
    ],
    ['should throw an error when PEM file is empty', emptyPemPath],
    ['should throw an error when PEM file does not exist', nonexistentFile],
  ])('%s', (_: string, testPemFilePath) => {
    expect(() =>
      convertPemToDerImpl({
        pemFile: testPemFilePath,
      }),
    ).toThrow();
  });
});

describe('createKmsKeyImpl', () => {
  const mockKeyId = 'mock-key-id';
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const mockAppId = '12345';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully create a KMS key with active tag and return its ARN', async () => {
    const createKeyResponse: CreateKeyCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      KeyMetadata: {
        KeyId: mockKeyId,
        Arn: mockAppKeyArn,
      } as KeyMetadata,
    };
    const describeKeyResponse: DescribeKeyCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      KeyMetadata: {
        KeyId: mockKeyId,
        Arn: mockAppKeyArn,
      } as KeyMetadata,
    };
    mockKmsClient.on(CreateKeyCommand).resolves(createKeyResponse);
    mockKmsClient.on(DescribeKeyCommand).resolves(describeKeyResponse);
    const result = await createKmsKeyImpl({ appId: mockAppId });
    expect(result).toBe(mockAppKeyArn);
    const createKeyCall = mockKmsClient.commandCalls(CreateKeyCommand)[0];
    expect(createKeyCall.args[0].input).toEqual({
      KeySpec: CREATE_KEY_SPEC,
      KeyUsage: 'SIGN_VERIFY',
      Origin: 'EXTERNAL',
      Description: `GitHub App Signing key for App ID ${mockAppId}`,
      Tags: [
        {
          TagKey: 'Status',
          TagValue: 'Active',
        },
        {
          TagKey: 'CreatedOn',
          TagValue: expect.any(String),
        },
        {
          TagKey: 'AppId',
          TagValue: mockAppId,
        },
        {
          TagKey: 'Genet-Managed',
          TagValue: 'true',
        },
      ],
    });
    const describeKeyCall = mockKmsClient.commandCalls(DescribeKeyCommand)[0];
    expect(describeKeyCall.args[0].input).toEqual({
      KeyId: mockKeyId,
    });
  });
  it('should throw an error when CreateKeyCommand returns no KeyId', async () => {
    const createKeyResponse: CreateKeyCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      KeyMetadata: {} as KeyMetadata,
    };
    mockKmsClient.on(CreateKeyCommand).resolves(createKeyResponse);
    await expect(createKmsKeyImpl({ appId: mockAppId })).rejects.toThrow(
      'Failed to create KMS key',
    );
  });
  it('should throw error when DescribeKeyCommand returns no KeyArn', async () => {
    const createKeyResponse: CreateKeyCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      KeyMetadata: {
        KeyId: mockKeyId,
      } as KeyMetadata,
    };
    const describeKeyResponse: DescribeKeyCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      KeyMetadata: {
        KeyId: mockKeyId,
      } as KeyMetadata,
    };
    mockKmsClient.on(CreateKeyCommand).resolves(createKeyResponse);
    mockKmsClient.on(DescribeKeyCommand).resolves(describeKeyResponse);
    await expect(createKmsKeyImpl({ appId: mockAppId })).rejects.toThrow(
      'Failed to retrieve KMS Key Arn',
    );
  });
  it('should throw an error when CreateKeyCommand fails', async () => {
    const mockError = new Error('KMS key creation failed');
    mockKmsClient.on(CreateKeyCommand).rejects(mockError);
    await expect(createKmsKeyImpl({ appId: mockAppId })).rejects.toThrow(
      'KMS key creation failed',
    );
  });
  it('should throw an error when DescribeKeyCommand fails', async () => {
    const mockError = new Error('Failed to retrieve key ARN');
    const createKeyResponse: CreateKeyCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      KeyMetadata: {
        KeyId: mockKeyId,
      } as KeyMetadata,
    };
    mockKmsClient.on(CreateKeyCommand).resolves(createKeyResponse);
    mockKmsClient.on(DescribeKeyCommand).rejects(mockError);
    await expect(createKmsKeyImpl({ appId: mockAppId })).rejects.toThrow(
      'Failed to retrieve key ARN',
    );
  });
});

describe('getKmsImportParametersImpl', () => {
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const mockPublicKey = new Uint8Array([1, 2, 3, 4]);
  const mockImportToken = new Uint8Array([5, 6, 7, 8]);
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should retrieve public key and import token successfully', async () => {
    const mockResponse: GetParametersForImportCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      PublicKey: mockPublicKey,
      ImportToken: mockImportToken,
    };
    mockKmsClient.on(GetParametersForImportCommand).resolves(mockResponse);
    const result = await getKmsImportParametersImpl({
      appKeyArn: mockAppKeyArn,
    });
    expect(result).toEqual({
      publicKey: mockPublicKey,
      importToken: mockImportToken,
    });
    const commandCall = mockKmsClient.commandCalls(
      GetParametersForImportCommand,
    )[0];
    expect(commandCall.args[0].input).toEqual({
      KeyId: mockAppKeyArn,
      WrappingAlgorithm: 'RSA_AES_KEY_WRAP_SHA_256',
      WrappingKeySpec: WRAPPING_SPEC,
    });
  });
  const mockMissingPublickeyResponse: GetParametersForImportCommandOutput = {
    $metadata: { requestId: 'mock-request-id' },
    ImportToken: mockImportToken,
  };
  const mockMissingImportTokenResponse: GetParametersForImportCommandOutput = {
    $metadata: { requestId: 'mock-request-id' },
    PublicKey: mockPublicKey,
  };
  const mockMissingBothParametersResponse: GetParametersForImportCommandOutput =
    {
      $metadata: { requestId: 'mock-request-id' },
    };
  it.each([
    [
      'should throw an error when PublicKey is missing in the response',
      mockMissingPublickeyResponse,
    ],
    [
      'should throw an error when ImportToken is missing in the response',
      mockMissingImportTokenResponse,
    ],
    [
      'should throw error when both PublicKey and ImportToken are missing',
      mockMissingBothParametersResponse,
    ],
  ])('%s', async (_: string, mockResponse) => {
    mockKmsClient.on(GetParametersForImportCommand).resolves(mockResponse);
    await expect(
      getKmsImportParametersImpl({ appKeyArn: mockAppKeyArn }),
    ).rejects.toThrow('Failed to retrieve wrapping key or import token');
  });
  it('should throw error when GetParameterForImportCommand fails', async () => {
    mockKmsClient
      .on(GetParametersForImportCommand)
      .rejects(new Error('Failed to retrieve import parameters'));
    await expect(
      getKmsImportParametersImpl({ appKeyArn: mockAppKeyArn }),
    ).rejects.toThrow('Failed to retrieve import parameters');
  });
});

describe('encryptKeyMaterialImpl', () => {
  let privateKeyDer: Buffer;
  let mockWrapKeyMaterial = jest.fn();
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });
  const importParams = {
    publicKey: new Uint8Array(publicKey),
    importToken: randomBytes(32),
  };
  privateKeyDer = privateKey;

  it('should encrypt key material successfully', async () => {
    const encryptedData = await encryptKeyMaterialImpl({
      privateKeyDer,
      importParams,
    });
    const encryptedAesKey = new Uint8Array(encryptedData).slice(0, 256);
    const wrappedKeyMaterial = new Uint8Array(encryptedData).slice(256);
    const decryptedAesKey = privateDecrypt(
      {
        key: createPrivateKey({
          key: privateKeyDer,
          format: 'der',
          type: 'pkcs8',
        }),
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedAesKey,
    );
    expect(decryptedAesKey.length).toBe(32);
    const decipher = createDecipheriv(
      'id-aes256-wrap-pad',
      decryptedAesKey,
      Buffer.from('A65959A6', 'hex'),
    );
    const decryptedKeyMaterial = Buffer.concat([
      decipher.update(wrappedKeyMaterial),
      decipher.final(),
    ]);

    expect(decryptedKeyMaterial).toEqual(privateKeyDer);
  });

  it('should throw an error if key material is empty', async () => {
    await expect(
      encryptKeyMaterialImpl({
        privateKeyDer: Buffer.alloc(0),
        importParams,
      }),
    ).rejects.toThrow('Key material cannot be empty');
  });

  it('should throw error when public key is invalid', async () => {
    await expect(
      encryptKeyMaterialImpl({
        privateKeyDer,
        importParams: {
          publicKey: new Uint8Array([1, 2, 3]),
          importToken: randomBytes(32),
        },
      }),
    ).rejects.toThrow();
  });

  it('should throw an error when wrapping Key Material fails', async () => {
    mockWrapKeyMaterial.mockImplementation(() => {
      throw new Error('Failed to wrap key material');
    });
    await expect(
      encryptKeyMaterialImpl({
        privateKeyDer,
        importParams,
        wrapKeyMaterial: mockWrapKeyMaterial,
      }),
    ).rejects.toThrow('Failed to wrap key material');
  });
});

describe('wrapKeyMaterialImpl', () => {
  function unwrapKeyMaterial(wrapped: Buffer, aesKey: Buffer): Buffer {
    const decipher = createDecipheriv(
      'id-aes256-wrap-pad',
      aesKey,
      Buffer.from('A65959A6', 'hex'),
    );
    return Buffer.concat([decipher.update(wrapped), decipher.final()]);
  }

  const aesKey = Buffer.from(
    '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F',
    'hex',
  ); // 32 bytes for AES-256

  const exactBlockSize = Buffer.from('0123456789ABCDEF', 'hex'); // 8 bytes
  const shorterKeyMaterial = Buffer.from('0123', 'hex'); // 2 bytes
  const longerKeyMaterial = Buffer.from(
    '0123456789ABCDEF0123456789ABCDEF',
    'hex',
  ); // 16 bytes
  const invalidAesKey = Buffer.from('0001020304', 'hex');
  const emptyKeyMaterial = Buffer.from('', 'hex');
  const nullKeyMaterial = null;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    [
      'should correctly wrap key material of exact block size',
      exactBlockSize,
      aesKey,
      exactBlockSize,
    ],
    [
      'should correctly wrap key material smaller than block size',
      shorterKeyMaterial,
      aesKey,
      shorterKeyMaterial,
    ],
    [
      'should correctly wrap key material larger than block size',
      longerKeyMaterial,
      aesKey,
      longerKeyMaterial,
    ],
  ])('%s', (_: string, inputKeyMaterial, inputAesKey, expectedKeyMaterial) => {
    const wrapped = wrapKeyMaterialImpl({
      keyMaterial: inputKeyMaterial,
      aesKey: inputAesKey,
    });
    expect(wrapped.length).toBeGreaterThan(inputKeyMaterial.length);
    const unwrapped = unwrapKeyMaterial(wrapped, aesKey);
    expect(unwrapped).toEqual(expectedKeyMaterial);
  });

  it.each([
    [
      'should throw an error with invalid AES key size',
      exactBlockSize,
      invalidAesKey,
    ],
    ['should throw an error with empty key material', emptyKeyMaterial, aesKey],
    [
      'should throw an error with null key material',
      nullKeyMaterial as any,
      aesKey,
    ],
  ])('%s', (_: string, inputKeyMaterial, inputAesKey) => {
    expect(() => {
      wrapKeyMaterialImpl({
        keyMaterial: inputKeyMaterial,
        aesKey: inputAesKey,
      });
    }).toThrow();
  });
});

describe('importKeyMaterialAndValidateImpl', () => {
  let mockvalidateJWT = jest.fn();
  let mockConsoleLog = jest.spyOn(console, 'log');
  const mockParams = {
    appKeyArn: 'arn:aws:kms:region:account:key/mock-key-id',
    appId: '12345',
    wrappedMaterial: Buffer.from('mock-wrapped-material'),
    importToken: new Uint8Array([1, 2, 3, 4]),
  };
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should import key material and validate JWT successfully', async () => {
    const mockResponse: ImportKeyMaterialCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
    };
    mockKmsClient.on(ImportKeyMaterialCommand).resolves(mockResponse);
    mockvalidateJWT.mockResolvedValue(true);
    await importKeyMaterialAndValidateImpl({
      ...mockParams,
      validateJWT: mockvalidateJWT,
    });
    expect(mockvalidateJWT).toHaveBeenCalledWith({
      appId: mockParams.appId,
      signFunction: expect.any(Function),
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      `Key material imported successfully and verified JWT signing for KMS key ARN: ${mockParams.appKeyArn}`,
    );
  });
  it('should throw an error when JWT validation fails', async () => {
    const mockResponse: ImportKeyMaterialCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
    };
    mockKmsClient.on(ImportKeyMaterialCommand).resolves(mockResponse);
    mockvalidateJWT.mockResolvedValue(false);
    await expect(
      importKeyMaterialAndValidateImpl({
        ...mockParams,
        validateJWT: mockvalidateJWT,
      }),
    ).rejects.toThrow(
      'Key material import successful but JWT authentication failed',
    );
    expect(mockvalidateJWT).toHaveBeenCalledWith({
      appId: mockParams.appId,
      signFunction: expect.any(Function),
    });
  });
  it('should throw an error when ImportKeyMaterialCommand fails', async () => {
    const mockError = new Error('Failed to import key material');
    mockKmsClient.on(ImportKeyMaterialCommand).rejects(mockError);
    await expect(
      importKeyMaterialAndValidateImpl({
        ...mockParams,
        validateJWT: mockvalidateJWT,
      }),
    ).rejects.toThrow('Failed to import key material');
    expect(mockvalidateJWT).not.toHaveBeenCalled();
  });
});

describe('updateAppsTableImpl', () => {
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const mockOldKeyArn = 'arn:aws:kms:region:account:key/old-key-id';
  const mockAppId = '12345';
  const mockTableName = 'validTable';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully update DynamoDB with new key when no previous key exists', async () => {
    const mockResponse: PutItemCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
    };
    mockDynamoDBClient.on(PutItemCommand).resolves(mockResponse);
    const mockHandleOldKey = jest.fn().mockReturnValue(undefined);
    await updateAppsTableImpl({
      appKeyArn: mockAppKeyArn,
      appId: mockAppId,
      tableName: mockTableName,
      handleOldKey: mockHandleOldKey,
    });
    expect(mockDynamoDBClient.calls()).toHaveLength(1);
    const [putItemCommand] = mockDynamoDBClient.calls();
    expect(putItemCommand.args[0].input).toEqual({
      TableName: mockTableName,
      Item: {
        AppId: { S: mockAppId },
        KmsKeyArn: { S: mockAppKeyArn },
      },
      ReturnValues: 'ALL_OLD',
    });
    expect(mockHandleOldKey).not.toHaveBeenCalled();
  });
  it('should update DynamoDB table with new key details and handle old key successfully', async () => {
    const mockResponse: PutItemCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      Attributes: {
        KmsKeyArn: { S: mockOldKeyArn },
      },
    };
    mockDynamoDBClient.on(PutItemCommand).resolves(mockResponse);
    const mockHandleOldKey = jest.fn().mockResolvedValue(undefined);
    await updateAppsTableImpl({
      appKeyArn: mockAppKeyArn,
      appId: mockAppId,
      tableName: mockTableName,
      handleOldKey: mockHandleOldKey,
    });
    expect(mockHandleOldKey).toHaveBeenCalledWith({
      oldKeyArn: mockOldKeyArn,
      appKeyArn: mockAppKeyArn,
      appId: mockAppId,
    });
  });
  it('should throw error when DynamoDB PutItemCommand fails', async () => {
    const mockError = new Error('Failed to update DynamoDB table');
    mockDynamoDBClient.on(PutItemCommand).rejects(mockError);
    const mockHandleOldKey = jest.fn();
    await expect(
      updateAppsTableImpl({
        appKeyArn: mockAppKeyArn,
        appId: mockAppId,
        tableName: mockTableName,
        handleOldKey: mockHandleOldKey,
      }),
    ).rejects.toThrow('Failed to update DynamoDB table');
    expect(mockHandleOldKey).not.toHaveBeenCalled();
  });
  it('should throw an error when handling old Key fails', async () => {
    const mockResponse: PutItemCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      Attributes: {
        KmsKeyArn: { S: mockOldKeyArn },
      },
    };
    mockDynamoDBClient.on(PutItemCommand).resolves(mockResponse);
    const mockHandleOldKey = jest
      .fn()
      .mockRejectedValue(new Error('Failed to handle old key'));
    await expect(
      updateAppsTableImpl({
        appKeyArn: mockAppKeyArn,
        appId: mockAppId,
        tableName: mockTableName,
        handleOldKey: mockHandleOldKey,
      }),
    ).rejects.toThrow('Failed to handle old key');
  });
});

describe('handleOldKeyImpl', () => {
  let mockTagOldKeyArn = jest.fn();
  let mockScheduleOldKeyDeletion = jest.fn();
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const mockOldKeyArn = 'arn:aws:kms:region:account:key/old-key-id';
  const mockAppId = '12345';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully tag old key arn as inactive and schedule it for deletion', async () => {
    mockTagOldKeyArn.mockResolvedValue(undefined);
    mockScheduleOldKeyDeletion.mockResolvedValue(undefined);
    await handleOldKeyImpl({
      oldKeyArn: mockOldKeyArn,
      appKeyArn: mockAppKeyArn,
      appId: mockAppId,
      tagOldKeyArn: mockTagOldKeyArn,
      scheduleOldKeyDeletion: mockScheduleOldKeyDeletion,
    });
    expect(mockTagOldKeyArn).toHaveBeenCalled();
    expect(mockScheduleOldKeyDeletion).toHaveBeenCalled();
  });
  it('should throw an error if tagging the old key arn fails', async () => {
    mockTagOldKeyArn.mockRejectedValue(
      new Error('Failed to tag the old key arn'),
    );
    await expect(
      handleOldKeyImpl({
        oldKeyArn: mockOldKeyArn,
        appKeyArn: mockAppKeyArn,
        appId: mockAppId,
        tagOldKeyArn: mockTagOldKeyArn,
      }),
    ).rejects.toThrow('Failed to tag the old key arn');
    expect(mockScheduleOldKeyDeletion).not.toHaveBeenCalled();
  });
  it('should throw an error if scheduling old key deletion fails', async () => {
    mockTagOldKeyArn.mockResolvedValue(undefined);
    mockScheduleOldKeyDeletion.mockRejectedValue(
      new Error('Failed to schedule old key for deletion'),
    );
    await expect(
      handleOldKeyImpl({
        oldKeyArn: mockOldKeyArn,
        appKeyArn: mockAppKeyArn,
        appId: mockAppId,
        tagOldKeyArn: mockTagOldKeyArn,
        scheduleOldKeyDeletion: mockScheduleOldKeyDeletion,
      }),
    ).rejects.toThrow('Failed to schedule old key for deletion');
  });
});

describe('scheduleOldKeyDeletionImpl', () => {
  const oldKeyArn = 'arn:aws:kms:region:account:key/old-key-id';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully schedule oldkey for deletion', async () => {
    const mockResponse: ScheduleKeyDeletionCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
    };
    mockKmsClient.on(ScheduleKeyDeletionCommand).resolves(mockResponse);
    await scheduleOldKeyDeletionImpl({ oldKeyArn });
    const kmsClientCalls = mockKmsClient.commandCalls(
      ScheduleKeyDeletionCommand,
    );
    expect(kmsClientCalls).toHaveLength(1);
    expect(kmsClientCalls[0].args[0].input).toEqual({
      KeyId: oldKeyArn,
      PendingWindowInDays: SCHEDULE_OLD_KEY_DELETION_DAYS,
    });
  });
  it('should throw an error if scheduling old key for deletion fails', async () => {
    mockKmsClient
      .on(ScheduleKeyDeletionCommand)
      .rejects(new Error('Failed to schedule old key for deletion'));
    await expect(scheduleOldKeyDeletionImpl({ oldKeyArn })).rejects.toThrow(
      'Failed to schedule old key for deletion',
    );
  });
});

describe('tagOldKeyArnImpl', () => {
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const oldKeyArn = 'arn:aws:kms:region:account:key/old-key-id';
  const mockAppId = '12345';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should tag old key successfully', async () => {
    jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('2024-01-01T00:00:00.000Z');
    const mockResponse: TagResourceCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
    };
    mockKmsClient.on(TagResourceCommand).resolves(mockResponse);
    await tagOldKeyArnImpl({
      oldKeyArn,
      appKeyArn: mockAppKeyArn,
      appId: mockAppId,
    });
    const tagCalls = mockKmsClient.commandCalls(TagResourceCommand);
    expect(tagCalls).toHaveLength(1);
    const tagParams = tagCalls[0].args[0].input;
    expect(tagParams).toEqual({
      KeyId: oldKeyArn,
      Tags: [
        {
          TagKey: 'Status',
          TagValue: 'Inactive',
        },
        {
          TagKey: 'ReplacedBy',
          TagValue: mockAppKeyArn,
        },
        {
          TagKey: 'ReplacedOn',
          TagValue: '2024-01-01T00:00:00.000Z',
        },
        {
          TagKey: 'AppId',
          TagValue: mockAppId,
        },
        {
          TagKey: 'Genet-Managed',
          TagValue: 'true',
        },
      ],
    });
  });
  it('should throw error when failed to tag the old key', async () => {
    mockKmsClient
      .on(TagResourceCommand)
      .rejects(new Error('Failed to tag old key arn'));
    await expect(
      tagOldKeyArnImpl({
        oldKeyArn,
        appKeyArn: mockAppKeyArn,
        appId: mockAppId,
      }),
    ).rejects.toThrow('Failed to tag old key arn');
  });
});

describe('tagKeyAsFailedImpl', () => {
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should tag key as Failed successfully', async () => {
    jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('2024-01-01T00:00:00.000Z');

    const mockResponse: TagResourceCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
    };

    mockKmsClient.on(TagResourceCommand).resolves(mockResponse);

    await tagKeyAsFailedImpl({
      appKeyArn: mockAppKeyArn,
    });

    const tagCalls = mockKmsClient.commandCalls(TagResourceCommand);
    expect(tagCalls).toHaveLength(1);

    const tagParams = tagCalls[0].args[0].input;
    expect(tagParams).toEqual({
      KeyId: mockAppKeyArn,
      Tags: [
        {
          TagKey: 'Status',
          TagValue: 'Failed',
        },
        {
          TagKey: 'Failed At',
          TagValue: '2024-01-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('should throw error when failed to tag the key as Failed', async () => {
    mockKmsClient
      .on(TagResourceCommand)
      .rejects(new Error('Failed to tag key as Failed'));

    await expect(
      tagKeyAsFailedImpl({
        appKeyArn: mockAppKeyArn,
      }),
    ).rejects.toThrow('Failed to tag key as Failed');
  });
});

describe('validateJWTImpl', () => {
  let mockFetch = jest.spyOn(global, 'fetch');
  const mockSuccessResponse = new Response(
    JSON.stringify({ id: 12345, name: 'Test App' }),
    {
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/json',
      }),
    },
  );
  const mockErrorResponse = new Response('Invalid token', {
    status: 401,
    statusText: 'Unauthorized',
    headers: new Headers({
      'content-type': 'text/plain',
    }),
  });
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should return true if GitHub API validates the JWT successfully', async () => {
    mockFetch.mockResolvedValue(mockSuccessResponse);

    const result = await validateJWTImpl({
      appId: '12345',
      signFunction: jest.fn().mockResolvedValue(Buffer.from('test-signature')),
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0][1];
    expect(fetchCall?.headers).toHaveProperty('Authorization');
    expect(fetchCall?.headers).toHaveProperty(
      'Accept',
      'application/vnd.github.v3+json',
    );
    expect(fetchCall?.headers).toHaveProperty(
      'User-Agent',
      'KMS-Key-Importer/1.0',
    );
  });
  it('should return false if the GitHub App ID does not match', async () => {
    const mismatchResponse = new Response(
      JSON.stringify({ id: 54321, name: 'Wrong App' }),
      {
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
      },
    );
    mockFetch.mockResolvedValueOnce(mismatchResponse);
    const result = await validateJWTImpl({
      appId: '12345',
      signFunction: jest.fn().mockResolvedValue(Buffer.from('test-signature')),
    });

    expect(result).toBe(false);
  });
  it('should return false if the GitHub API returns an error', async () => {
    mockFetch.mockResolvedValueOnce(mockErrorResponse as Response);
    const result = await validateJWTImpl({
      appId: '12345',
      signFunction: jest.fn().mockResolvedValue(Buffer.from('test-signature')),
    });
    expect(result).toBe(false);
  });
  it('should return false if the signing function throws an error', async () => {
    const failingSignFunction = jest
      .fn()
      .mockRejectedValue(new Error('Signing Failed'));
    mockFetch.mockResolvedValueOnce(mockErrorResponse as Response);
    const result = await validateJWTImpl({
      appId: '12345',
      signFunction: failingSignFunction,
    });
    expect(result).toBe(false);
  });
  it('should return false if the GitHub API call throws an error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('GitHub Network error'));
    const result = await validateJWTImpl({
      appId: '12345',
      signFunction: jest.fn().mockResolvedValue(Buffer.from('test-signature')),
    });
    expect(result).toBe(false);
  });
});

describe('kmsSignImpl', () => {
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const mockMessage = 'testMessage';
  const mockSignature = Buffer.from('mock-signature');
  const expectedMessageHash = createHash('sha256').update(mockMessage).digest();
  beforeEach(() => {
    jest.resetAllMocks();
  });
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
  it('should throw an error when KMS returns a response without a signature', async () => {
    const mockSignResponse: SignCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
    };
    mockKmsClient.on(SignCommand).resolves(mockSignResponse);
    await expect(
      kmsSignImpl({
        appKeyArn: mockAppKeyArn,
        message: mockMessage,
      }),
    ).rejects.toThrow('KMS signing failed');
  });
  it('should throw an error when KMS returns an empty signature', async () => {
    const mockSignResponse: SignCommandOutput = {
      $metadata: { requestId: 'mock-request-id' },
      Signature: new Uint8Array(),
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

describe('pemSignImpl', () => {
  let publicKey: KeyObject;
  let privateKeyContent: string;
  const pemFilePath = '/path/to/github-private-key.pem';
  const invalidPemPath = '/path/to/invalidFile.pem';
  const nonexistentPath = '/path/to/nonexistent.pem';
  beforeEach(() => {
    const { privateKey, publicKey: pubKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    privateKeyContent = privateKey;
    publicKey = createPublicKey(pubKey);

    mockFs({
      '/path/to': {
        'github-private-key.pem': privateKeyContent,
        'invalidFile.pem': 'invalid content',
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
  });
  it('should successfully sign a message using private key and verify with corresponding public key', async () => {
    const message = 'Hello, GitHub App';
    const signature = await pemSignImpl({
      pemFile: pemFilePath,
      message,
    });
    expect(Buffer.isBuffer(signature)).toBe(true);
    const isValid = verify(
      'sha256',
      Buffer.from(message),
      publicKey,
      signature,
    );
    expect(isValid).toBe(true);
  });

  it('should generate different signatures for different messages', async () => {
    const message1 = 'Hello';
    const message2 = 'GitHub App';
    const signature1 = await pemSignImpl({
      pemFile: pemFilePath,
      message: message1,
    });
    const signature2 = await pemSignImpl({
      pemFile: pemFilePath,
      message: message2,
    });
    expect(signature1).not.toEqual(signature2);
  });

  it('should throw an error if the PEM file does not exist', async () => {
    await expect(
      pemSignImpl({
        pemFile: nonexistentPath,
        message: 'Hello, GitHub App',
      }),
    ).rejects.toThrow(/ENOENT/);
  });

  it('should throw an error if the PEM file contains invalid content', async () => {
    await expect(
      pemSignImpl({
        pemFile: invalidPemPath,
        message: 'test',
      }),
    ).rejects.toThrow();
  });

  it('should handle an empty message', async () => {
    const signature = await pemSignImpl({
      pemFile: pemFilePath,
      message: '',
    });
    expect(Buffer.isBuffer(signature)).toBe(true);
    const isValid = verify('sha256', Buffer.from(''), publicKey, signature);
    expect(isValid).toBe(true);
  });

  it('should handle long messages', async () => {
    const longMessage = 'a'.repeat(10000);
    const signature = await pemSignImpl({
      pemFile: pemFilePath,
      message: longMessage,
    });
    expect(Buffer.isBuffer(signature)).toBe(true);
    const isValid = verify(
      'sha256',
      Buffer.from(longMessage),
      publicKey,
      signature,
    );
    expect(isValid).toBe(true);
  });
});

describe('importPrivateKey', () => {
  const mockAppId = '12345';
  const mockTableName = 'validTable';
  const mockDerFormat = 'der-formatted-key';
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const mockPublicKey = 'mock-public-key';
  const mockImportToken = 'mock-import-token';
  const mockEncryptedKey = 'encrypted-key-material';
  const pemFilePath = '/path/to/github-private-key.pem';
  const resolvedPemFile = resolve(pemFilePath);
  let mockValidateInputs = jest.fn();
  let mockConvertPemToDer = jest.fn();
  let mockCreateKmsKey = jest.fn();
  let mockGetKmsImportParameters = jest.fn();
  let mockEncryptKeyMaterial = jest.fn();
  let mockImportKeyMaterialAndValidate = jest.fn();
  let mockUpdateAppsTable = jest.fn();
  let mockTagKeyAsFailed = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    mockFs({
      '/path/to': {
        'github-private-key.pem': 'private-key',
      },
    });
    mockValidateInputs.mockResolvedValue(true);
    mockConvertPemToDer.mockReturnValue(mockDerFormat);
    mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
    mockGetKmsImportParameters.mockResolvedValue({
      publicKey: mockPublicKey,
      importToken: mockImportToken,
    });
    mockEncryptKeyMaterial.mockResolvedValue(mockEncryptedKey);
    mockImportKeyMaterialAndValidate.mockResolvedValue(undefined);
    mockUpdateAppsTable.mockResolvedValue(undefined);
    mockTagKeyAsFailed.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockFs.restore();
    jest.clearAllMocks();
  });

  it('should successfully import private key and delete PEM file after all steps process successfully', async () => {
    await importPrivateKey({
      pemFilePath,
      appId: mockAppId,
      tableName: mockTableName,
      validateInputs: mockValidateInputs,
      convertPemToDer: mockConvertPemToDer,
      createKmsKey: mockCreateKmsKey,
      getKmsImportParameters: mockGetKmsImportParameters,
      encryptKeyMaterial: mockEncryptKeyMaterial,
      importKeyMaterialAndValidate: mockImportKeyMaterialAndValidate,
      updateAppsTable: mockUpdateAppsTable,
      tagKeyAsFailed: mockTagKeyAsFailed,
    });
    expect(mockValidateInputs).toHaveBeenCalledWith({
      pemFile: resolvedPemFile,
      appId: mockAppId,
      tableName: mockTableName,
    });
    expect(mockConvertPemToDer).toHaveBeenCalledWith({
      pemFile: resolvedPemFile,
    });
    expect(mockCreateKmsKey).toHaveBeenCalledWith({
      appId: mockAppId,
    });
    expect(mockGetKmsImportParameters).toHaveBeenCalledWith({
      appKeyArn: mockAppKeyArn,
    });
    expect(mockEncryptKeyMaterial).toHaveBeenCalledWith({
      privateKeyDer: mockDerFormat,
      importParams: {
        publicKey: mockPublicKey,
        importToken: mockImportToken,
      },
    });
    expect(mockImportKeyMaterialAndValidate).toHaveBeenCalledWith({
      appKeyArn: mockAppKeyArn,
      appId: mockAppId,
      wrappedMaterial: mockEncryptedKey,
      importToken: mockImportToken,
    });
    expect(mockUpdateAppsTable).toHaveBeenCalledWith({
      appKeyArn: mockAppKeyArn,
      appId: mockAppId,
      tableName: mockTableName,
    });
    // File should be deleted after successful import
    expect(() => readFileSync(pemFilePath)).toThrow();
    expect(mockTagKeyAsFailed).not.toHaveBeenCalled();
  });

  it.each([
    [
      'validateInputs',
      () => {
        mockValidateInputs.mockRejectedValue(
          new Error('Inputs validation failed'),
        );
        return 'Inputs validation failed';
      },
      false,
    ],
    [
      'convertPemToDer',
      () => {
        mockConvertPemToDer.mockImplementation(() => {
          throw new Error('PEM to DER conversion failed');
        });
        return 'PEM to DER conversion failed';
      },
      false,
    ],
    [
      'createKmsKey',
      () => {
        mockCreateKmsKey.mockRejectedValue(
          new Error('KMS key creation failed'),
        );
        return 'KMS key creation failed';
      },
      false,
    ],
    [
      'getKmsImportParameters',
      () => {
        mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
        mockGetKmsImportParameters.mockRejectedValue(
          new Error('Failed to get import parameters'),
        );
        return 'Failed to get import parameters';
      },
      true,
    ],
    [
      'encryptKeyMaterial',
      () => {
        mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
        mockGetKmsImportParameters.mockResolvedValue({
          publicKey: mockPublicKey,
          importToken: mockImportToken,
        });
        mockEncryptKeyMaterial.mockRejectedValue(
          new Error('Encryption failed'),
        );
        return 'Encryption failed';
      },
      true,
    ],
    [
      'importKeyMaterialAndValidate',
      () => {
        mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
        mockGetKmsImportParameters.mockResolvedValue({
          publicKey: mockPublicKey,
          importToken: mockImportToken,
        });
        mockEncryptKeyMaterial.mockResolvedValue(mockEncryptedKey);
        mockImportKeyMaterialAndValidate.mockRejectedValue(
          new Error('Import validation failed'),
        );
        return 'Import validation failed';
      },
      true,
    ],
    [
      'updateAppsTable',
      () => {
        mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
        mockGetKmsImportParameters.mockResolvedValue({
          publicKey: mockPublicKey,
          importToken: mockImportToken,
        });
        mockEncryptKeyMaterial.mockResolvedValue(mockEncryptedKey);
        mockImportKeyMaterialAndValidate.mockResolvedValue(undefined);
        mockUpdateAppsTable.mockRejectedValue(
          new Error('Failed to update apps table'),
        );
        return 'Failed to update apps table';
      },
      true,
    ],
  ])(
    'should throw error when %s fails',
    async (_: string, setupFailureAndGetError, shouldTagAsFailed: boolean) => {
      const expectedError = setupFailureAndGetError();
      await expect(
        importPrivateKey({
          pemFilePath,
          appId: mockAppId,
          tableName: mockTableName,
          validateInputs: mockValidateInputs,
          convertPemToDer: mockConvertPemToDer,
          createKmsKey: mockCreateKmsKey,
          getKmsImportParameters: mockGetKmsImportParameters,
          encryptKeyMaterial: mockEncryptKeyMaterial,
          importKeyMaterialAndValidate: mockImportKeyMaterialAndValidate,
          updateAppsTable: mockUpdateAppsTable,
          tagKeyAsFailed: mockTagKeyAsFailed,
        }),
      ).rejects.toThrow(expectedError);

      if (shouldTagAsFailed) {
        expect(mockTagKeyAsFailed).toHaveBeenCalledWith({
          appKeyArn: mockAppKeyArn,
        });
      } else {
        expect(mockTagKeyAsFailed).not.toHaveBeenCalled();
      }
    },
  );
});

// describe('importPrivateKey', () => {
//   const mockAppId = '12345';
//   const mockTableName = 'validTable';
//   const mockDerFormat = 'der-formatted-key';
//   const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
//   const mockPublicKey = 'mock-public-key';
//   const mockImportToken = 'mock-import-token';
//   const mockEncryptedKey = 'encrypted-key-material';
//   const mockUnlinkFileSync = fs.unlinkSync as jest.Mock;
//   let mockValidateInputs = jest.fn();
//   let mockConvertPemToDer = jest.fn();
//   let mockCreateKmsKey = jest.fn();
//   let mockGetKmsImportParameters = jest.fn();
//   let mockEncryptKeyMaterial = jest.fn();
//   let mockImportKeyMaterialAndValidate = jest.fn();
//   let mockUpdateAppsTable = jest.fn();
//   let mockTagKeyAsFailed = jest.fn();
//   let tempDir: string;
//   let tempPemFile: string;
//   let resolvedPemFile: string;
//   beforeAll(() => {
//     tempDir = mkdtempSync(tmpdir());
//     tempPemFile = join(tempDir, 'github-private-key.pem');
//     resolvedPemFile = tempPemFile;
//   });
//   beforeEach(() => {
//     writeFileSync(tempPemFile, 'private-key');
//     const mockPath = path.resolve as jest.Mock;
//     mockPath.mockReturnValue(resolvedPemFile);
//     mockValidateInputs.mockResolvedValue(true);
//     mockConvertPemToDer.mockReturnValue(mockDerFormat);
//     mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
//     mockGetKmsImportParameters.mockResolvedValue({
//       publicKey: mockPublicKey,
//       importToken: mockImportToken,
//     });
//     mockEncryptKeyMaterial.mockResolvedValue(mockEncryptedKey);
//     mockImportKeyMaterialAndValidate.mockResolvedValue(undefined);
//     mockUpdateAppsTable.mockResolvedValue(undefined);
//     mockTagKeyAsFailed.mockResolvedValue(undefined);
//   });
//   afterEach(() => {
//     jest.clearAllMocks();
//     if (existsSync(tempPemFile)) {
//       unlinkSync(tempPemFile);
//     }
//   });
//   afterAll(() => {
//     rmSync(tempDir, { recursive: true, force: true });
//   });
//   it('should successfully import private key and delete PEM file after all steps process successfully', async () => {
//     await importPrivateKey({
//       pemFilePath: tempPemFile,
//       appId: mockAppId,
//       tableName: mockTableName,
//       validateInputs: mockValidateInputs,
//       convertPemToDer: mockConvertPemToDer,
//       createKmsKey: mockCreateKmsKey,
//       getKmsImportParameters: mockGetKmsImportParameters,
//       encryptKeyMaterial: mockEncryptKeyMaterial,
//       importKeyMaterialAndValidate: mockImportKeyMaterialAndValidate,
//       updateAppsTable: mockUpdateAppsTable,
//       tagKeyAsFailed: mockTagKeyAsFailed,
//     });
//     expect(resolve).toHaveBeenCalledWith(tempPemFile);
//     expect(mockValidateInputs).toHaveBeenCalledWith({
//       pemFile: resolvedPemFile,
//       appId: mockAppId,
//       tableName: mockTableName,
//     });
//     expect(mockConvertPemToDer).toHaveBeenCalledWith({
//       pemFile: resolvedPemFile,
//     });
//     expect(mockCreateKmsKey).toHaveBeenCalledWith({
//       appId: mockAppId,
//     });
//     expect(mockGetKmsImportParameters).toHaveBeenCalledWith({
//       appKeyArn: mockAppKeyArn,
//     });
//     expect(mockEncryptKeyMaterial).toHaveBeenCalledWith({
//       privateKeyDer: mockDerFormat,
//       importParams: {
//         publicKey: mockPublicKey,
//         importToken: mockImportToken,
//       },
//     });
//     expect(mockImportKeyMaterialAndValidate).toHaveBeenCalledWith({
//       appKeyArn: mockAppKeyArn,
//       appId: mockAppId,
//       wrappedMaterial: mockEncryptedKey,
//       importToken: mockImportToken,
//     });
//     expect(mockUpdateAppsTable).toHaveBeenCalledWith({
//       appKeyArn: mockAppKeyArn,
//       appId: mockAppId,
//       tableName: mockTableName,
//     });
//     expect(mockUnlinkFileSync).toHaveBeenCalledWith(tempPemFile);
//     expect(mockTagKeyAsFailed).not.toHaveBeenCalled();
//   });
//   it.each([
//     [
//       'validateInputs',
//       () => {
//         mockValidateInputs.mockRejectedValue(
//           new Error('Inputs validation failed'),
//         );
//         return 'Inputs validation failed';
//       },
//       false,
//     ],
//     [
//       'convertPemToDer',
//       () => {
//         mockConvertPemToDer.mockImplementation(() => {
//           throw new Error('PEM to DER conversion failed');
//         });
//         return 'PEM to DER conversion failed';
//       },
//       false,
//     ],
//     [
//       'createKmsKey',
//       () => {
//         mockCreateKmsKey.mockRejectedValue(
//           new Error('KMS key creation failed'),
//         );
//         return 'KMS key creation failed';
//       },
//       false,
//     ],
//     [
//       'getKmsImportParameters',
//       () => {
//         mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
//         mockGetKmsImportParameters.mockRejectedValue(
//           new Error('Failed to get import parameters'),
//         );
//         return 'Failed to get import parameters';
//       },
//       true,
//     ],
//     [
//       'encryptKeyMaterial',
//       () => {
//         mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
//         mockGetKmsImportParameters.mockResolvedValue({
//           publicKey: mockPublicKey,
//           importToken: mockImportToken,
//         });
//         mockEncryptKeyMaterial.mockRejectedValue(
//           new Error('Encryption failed'),
//         );
//         return 'Encryption failed';
//       },
//       true,
//     ],
//     [
//       'importKeyMaterialAndValidate',
//       () => {
//         mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
//         mockGetKmsImportParameters.mockResolvedValue({
//           publicKey: mockPublicKey,
//           importToken: mockImportToken,
//         });
//         mockEncryptKeyMaterial.mockResolvedValue(mockEncryptedKey);
//         mockImportKeyMaterialAndValidate.mockRejectedValue(
//           new Error('Import validation failed'),
//         );
//         return 'Import validation failed';
//       },
//       true,
//     ],
//     [
//       'updateAppsTable',
//       () => {
//         mockCreateKmsKey.mockResolvedValue(mockAppKeyArn);
//         mockGetKmsImportParameters.mockResolvedValue({
//           publicKey: mockPublicKey,
//           importToken: mockImportToken,
//         });
//         mockEncryptKeyMaterial.mockResolvedValue(mockEncryptedKey);
//         mockImportKeyMaterialAndValidate.mockResolvedValue(undefined);
//         mockUpdateAppsTable.mockRejectedValue(
//           new Error('Failed to update apps table'),
//         );
//         return 'Failed to update apps table';
//       },
//       true,
//     ],
//   ])(
//     'should throw error when %s fails',
//     async (_: string, setupFailureAndGetError, shouldTagAsFailed: boolean) => {
//       const expectedError = setupFailureAndGetError();
//       await expect(
//         importPrivateKey({
//           pemFilePath: tempPemFile,
//           appId: mockAppId,
//           tableName: mockTableName,
//           validateInputs: mockValidateInputs,
//           convertPemToDer: mockConvertPemToDer,
//           createKmsKey: mockCreateKmsKey,
//           getKmsImportParameters: mockGetKmsImportParameters,
//           encryptKeyMaterial: mockEncryptKeyMaterial,
//           importKeyMaterialAndValidate: mockImportKeyMaterialAndValidate,
//           updateAppsTable: mockUpdateAppsTable,
//           tagKeyAsFailed: mockTagKeyAsFailed,
//         }),
//       ).rejects.toThrow(expectedError);
//       if (shouldTagAsFailed) {
//         expect(mockTagKeyAsFailed).toHaveBeenCalledWith({
//           appKeyArn: mockAppKeyArn,
//         });
//       } else {
//         expect(mockTagKeyAsFailed).not.toHaveBeenCalled();
//       }
//     },
//   );
// });

describe('main', () => {
  const originalArgs = process.argv;
  const mockExit = jest
    .spyOn(process, 'exit')
    .mockImplementation((): never => undefined as never);
  const mockConsoleError = jest.spyOn(console, 'error');
  const pemFilePath = '/path/to/privatekey.pem';
  const appId = '12345';
  const tableName = 'validTable';

  afterAll(() => {
    jest.clearAllMocks();
    process.argv = originalArgs;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.argv = [...originalArgs];
  });

  it('should execute successfully with all required parameters', async () => {
    const fetchSpy = jest
      .spyOn(importKey, 'importPrivateKey')
      .mockImplementation(() => Promise.resolve());
    process.argv = ['', '', pemFilePath, appId, tableName];
    await expect(importKey.main()).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith({ pemFilePath, appId, tableName });
  });

  it.each([
    ['should exit with error when all args are missing', ['', '', '']],
    [
      'should exit with error when appId and pemFilePath are missing',
      ['', '', tableName],
    ],
    [
      'should exit with error when appId and tableName are missing',
      [pemFilePath, '', ''],
    ],
    [
      'should exit with error when pemFilePath and tableName are missing',
      ['', appId, ''],
    ],
    [
      'should exit with error when pemFilePath is missing',
      ['', appId, tableName],
    ],
    [
      'should exit with error when appId is missing',
      [pemFilePath, '', tableName],
    ],
    [
      'should exit with error when tableName is missing',
      [pemFilePath, appId, ''],
    ],
  ])('%s', async (_: string, args) => {
    process.argv = args;
    const errorMessage = [
      'Please provide GitHub App PEM file path, GitHub AppId and the table name to store the AppId and Key ARN',
      'Usage: npm run import-private-key <path-to-private-key.pem> <GitHubAppId> <TableName>',
      'NOTE: For TableName, `npm run get-table-name` should list the available tables',
      '',
    ].join('\n\n');
    await expect(importKey.main()).resolves.toBeUndefined();
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalledWith(errorMessage);
  });
});
