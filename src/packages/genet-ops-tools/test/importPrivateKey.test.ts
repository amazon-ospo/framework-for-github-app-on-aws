import * as crypto from 'crypto';
import { createHash, createDecipheriv } from 'crypto';
import * as fs from 'fs';
import { resolve } from 'path';
import * as path from 'path';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createPublicKey: jest.fn(),
  randomBytes: jest.fn(),
  publicEncrypt: jest.fn(),
  createPrivateKey: jest.fn(),
  sign: jest.fn(),
}));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn(),
}));

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
  convertPemToDerImpl,
  importPrivateKey,
  validateJWTImpl,
  encryptKeyMaterialImpl,
  kmsSignImpl,
  importKeyMaterialAndValidateImpl,
  pemSignImpl,
  getKmsImportParametersImpl,
  wrapKeyMaterialImpl,
  validateInputsImpl,
} from '../src/importPrivateKey';
import * as importKey from '../src/importPrivateKey';

const mockKmsClient = mockClient(KMSClient);
const mockDynamoDBClient = mockClient(DynamoDBClient);
afterAll(() => {
  mockKmsClient.reset();
  mockDynamoDBClient.reset();
  jest.clearAllMocks();
});

describe('validateInputsImpl', () => {
  let mockValidateJWT = jest.fn();
  let mockListTables = jest.fn();
  const mockExistsSync = fs.existsSync as jest.Mock;
  const mockPemFilePath = '/path/to/privatekey.pem';
  const mockWrongPrivateKeyPath = 'path/to/wrongPrivateKey.pem';
  const mockAppId = '12345';
  const mockTableName = 'validTable';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should validate inputs successfully when PEM file exists, GitHub authentication succeeds and valid table name is provided', async () => {
    mockExistsSync.mockReturnValue(true);
    mockValidateJWT.mockResolvedValue(true);
    mockListTables.mockResolvedValue(['validTable', 'otherTable']);

    await validateInputsImpl({
      pemFile: mockPemFilePath,
      appId: mockAppId,
      tableName: mockTableName,
      validateJWt: mockValidateJWT,
      listTables: mockListTables,
    });
    expect(mockExistsSync).toHaveBeenCalledWith('/path/to/privatekey.pem');
    expect(mockValidateJWT).toHaveBeenCalledWith({
      appId: mockAppId,
      signFunction: expect.any(Function),
    });
    expect(mockListTables).toHaveBeenCalled();
  });
  it('should throw error when PEM file does not exist', async () => {
    mockExistsSync.mockReturnValue(false);
    await expect(
      validateInputsImpl({
        pemFile: '/path/to/nonexistent.pem',
        appId: mockAppId,
        tableName: mockTableName,
      }),
    ).rejects.toThrow('File not found at the path: /path/to/nonexistent.pem');
    expect(mockExistsSync).toHaveBeenCalledWith('/path/to/nonexistent.pem');
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
    mockExistsSync.mockReturnValue(true);
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
    expect(mockExistsSync).toHaveBeenCalledWith(pemFile);
    expect(mockValidateJWT).toHaveBeenCalledWith({
      appId: appId,
      signFunction: expect.any(Function),
    });
    expect(mockListTables).not.toHaveBeenCalled();
  });
  it('should throw error when provided table name is not in the list of tables', async () => {
    mockExistsSync.mockReturnValue(true);
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
    mockExistsSync.mockReturnValue(true);
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
  it('should throw error when existsSync fails to check for file existence', async () => {
    mockExistsSync.mockImplementation(() => {
      throw new Error('Filesystem error');
    });

    await expect(
      validateInputsImpl({
        pemFile: '/path/to/key.pem',
        appId: mockAppId,
        tableName: mockTableName,
      }),
    ).rejects.toThrow('Filesystem error');
  });
  it('should throw error when GitHub authentication fails due to API error', async () => {
    mockExistsSync.mockReturnValue(true);
    mockValidateJWT.mockRejectedValue(new Error('GitHub API Error'));

    await expect(
      validateInputsImpl({
        pemFile: '/path/to/key.pem',
        appId: mockAppId,
        tableName: mockTableName,
        validateJWt: mockValidateJWT,
        listTables: mockListTables,
      }),
    ).rejects.toThrow('GitHub API Error');
  });
});

describe('convertPemToDerImpl', () => {
  const mockPemFilePath = '/path/to/privatekey.pem';
  const mockPemContent =
    '-----BEGIN PRIVATE KEY-----\nMOCK_KEY_CONTENT\n-----END PRIVATE KEY-----';
  const mockDerBuffer = Buffer.from('mock-der-content');
  const mockReadFileSync = fs.readFileSync as jest.Mock;
  const mockCreatePrivateKey = crypto.createPrivateKey as jest.Mock;
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should convert a valid PEM file to DER format', () => {
    const mockKeyObject: crypto.KeyObject = {
      export: jest.fn().mockReturnValue(mockDerBuffer),
      equals: jest.fn(),
      type: 'private',
      toCryptoKey: jest.fn(),
    };
    mockReadFileSync.mockReturnValue(mockPemContent);
    mockCreatePrivateKey.mockReturnValue(mockKeyObject);
    const result = convertPemToDerImpl({ pemFile: mockPemFilePath });
    expect(mockReadFileSync).toHaveBeenCalledWith(mockPemFilePath, 'utf8');
    expect(mockCreatePrivateKey).toHaveBeenCalledWith(mockPemContent);
    expect(mockKeyObject.export).toHaveBeenCalledWith({
      type: 'pkcs8',
      format: 'der',
    });
    expect(result).toBe(mockDerBuffer);
  });
  it('should throw an error when PEM file contains invalid content', () => {
    const invalidPemContent = 'invalid-pem-content';
    mockReadFileSync.mockReturnValue(invalidPemContent);
    mockCreatePrivateKey.mockImplementation(() => {
      throw new Error('Invalid PEM content');
    });

    expect(() => convertPemToDerImpl({ pemFile: mockPemFilePath })).toThrow(
      'Invalid PEM content',
    );
    expect(mockReadFileSync).toHaveBeenCalledWith(mockPemFilePath, 'utf8');
    expect(mockCreatePrivateKey).toHaveBeenCalledWith(invalidPemContent);
  });
  it('should throw an error when PEM file does not exist', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });
    expect(() => convertPemToDerImpl({ pemFile: mockPemFilePath })).toThrow(
      'File not found',
    );
    expect(mockReadFileSync).toHaveBeenCalledWith(mockPemFilePath, 'utf8');
    expect(mockCreatePrivateKey).not.toHaveBeenCalled();
  });
  it('should throw an error when PEM file is empty', () => {
    mockReadFileSync.mockReturnValue('');
    mockCreatePrivateKey.mockImplementation(() => {
      throw new Error('Empty PEM content');
    });

    expect(() => convertPemToDerImpl({ pemFile: mockPemFilePath })).toThrow(
      'Empty PEM content',
    );
    expect(mockReadFileSync).toHaveBeenCalledWith(mockPemFilePath, 'utf8');
    expect(mockCreatePrivateKey).toHaveBeenCalledWith('');
  });
  it('should throw an error when key in PEM file is not an RSA private key', () => {
    const publicKeyPem =
      '-----BEGIN PUBLIC KEY-----\nMOCK_PUBLIC_KEY\n-----END PUBLIC KEY-----';
    mockReadFileSync.mockReturnValue(publicKeyPem);
    mockCreatePrivateKey.mockImplementation(() => {
      throw new Error('Invalid key type');
    });

    expect(() => convertPemToDerImpl({ pemFile: mockPemFilePath })).toThrow(
      'Invalid key type',
    );
    expect(mockReadFileSync).toHaveBeenCalledWith(mockPemFilePath, 'utf8');
    expect(mockCreatePrivateKey).toHaveBeenCalledWith(publicKeyPem);
  });
  it('should throw an error when export function fails to convert to DER format', () => {
    const mockKeyObject: crypto.KeyObject = {
      export: jest.fn().mockImplementation(() => {
        throw new Error('Export failed');
      }),
      equals: jest.fn(),
      type: 'private',
      toCryptoKey: jest.fn(),
    };
    mockReadFileSync.mockReturnValue(mockPemContent);
    mockCreatePrivateKey.mockReturnValue(mockKeyObject);

    expect(() => convertPemToDerImpl({ pemFile: mockPemFilePath })).toThrow(
      'Export failed',
    );
    expect(mockReadFileSync).toHaveBeenCalledWith(mockPemFilePath, 'utf8');
    expect(mockCreatePrivateKey).toHaveBeenCalledWith(mockPemContent);
    expect(mockKeyObject.export).toHaveBeenCalledWith({
      type: 'pkcs8',
      format: 'der',
    });
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
  const mockCreatePublicKey = crypto.createPublicKey as jest.Mock;
  const mockRandomBytes = crypto.randomBytes as jest.Mock;
  const mockPublicEncrypt = crypto.publicEncrypt as jest.Mock;
  const mockDerBuffer = Buffer.from('mock-der-content');
  const mockWrappedKey = Buffer.from('mock-wrapped-key');
  const mockImportParameters = {
    publicKey: new Uint8Array([1, 2, 3, 4]),
    importToken: new Uint8Array([5, 6, 7, 8]),
  };
  const mockAesKey = Buffer.from('mock-aes-key-32-bytes-long-string-12');
  const mockEncryptedAesKey = Buffer.from('mock-encrypted-aes-key');
  let mockWrapKeyMaterial = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    mockRandomBytes.mockImplementation(() => mockAesKey);
    mockWrapKeyMaterial.mockReturnValue(mockWrappedKey);
  });
  it('should encrypt key material successfully', async () => {
    const mockKeyObject: crypto.KeyObject = {
      type: 'public',
      export: jest.fn(),
      equals: jest.fn(),
      toCryptoKey: jest.fn(),
    };
    mockCreatePublicKey.mockReturnValue(mockKeyObject);
    mockPublicEncrypt.mockReturnValue(mockEncryptedAesKey);
    const result = await encryptKeyMaterialImpl({
      privateKeyDer: mockDerBuffer,
      importParams: mockImportParameters,
      wrapKeyMaterial: mockWrapKeyMaterial,
    });
    expect(mockCreatePublicKey).toHaveBeenCalledWith({
      key: Buffer.from(mockImportParameters.publicKey),
      format: 'der',
      type: 'spki',
    });
    expect(mockRandomBytes).toHaveBeenCalledWith(32);
    expect(mockWrapKeyMaterial).toHaveBeenCalledWith({
      keyMaterial: mockDerBuffer,
      aesKey: mockAesKey,
    });
    expect(mockPublicEncrypt).toHaveBeenCalledWith(
      {
        key: mockKeyObject,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      mockAesKey,
    );
    expect(result).toEqual(
      Buffer.concat([mockEncryptedAesKey, mockWrappedKey]),
    );
  });
  it('should throw an error when wrapping Key Material fails', async () => {
    mockWrapKeyMaterial.mockImplementation(() => {
      throw new Error('Failed to wrap key material');
    });
    await expect(
      encryptKeyMaterialImpl({
        privateKeyDer: mockDerBuffer,
        importParams: mockImportParameters,
        wrapKeyMaterial: mockWrapKeyMaterial,
      }),
    ).rejects.toThrow('Failed to wrap key material');
  });
  it.each([
    [
      'public key encryption',
      () => {
        mockPublicEncrypt.mockImplementation(() => {
          throw new Error('Encryption failed');
        });
        return 'Encryption failed';
      },
    ],
    [
      'AES key generation fails',
      () => {
        mockRandomBytes.mockImplementation(() => {
          throw new Error('Failed to generate randomBytes');
        });
        return 'Failed to generate randomBytes';
      },
    ],
    [
      'createPublicKey',
      () => {
        mockCreatePublicKey.mockImplementation(() => {
          throw new Error('Invalid public key');
        });
        return 'Invalid public key';
      },
    ],
  ])(
    'should throw error when %s fails',
    async (_: string, setupFailureAndGetError) => {
      const expectedError = setupFailureAndGetError();

      await expect(
        encryptKeyMaterialImpl({
          privateKeyDer: mockDerBuffer,
          importParams: mockImportParameters,
          wrapKeyMaterial: mockWrapKeyMaterial,
        }),
      ).rejects.toThrow(expectedError);
    },
  );
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
      'Key material imported successfully and verified JWT signing',
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
  const mockPemFilePath = '/path/to/privatekey.pem';
  const mockPemContent =
    '-----BEGIN PRIVATE KEY-----\nMOCK_KEY_CONTENT\n-----END PRIVATE KEY-----';
  const mockMessage = 'testMessage';
  const mockSignature = Buffer.from('mock-signature');
  const mockReadFileSync = fs.readFileSync as jest.Mock;
  const mockCreatePrivateKey = crypto.createPrivateKey as jest.Mock;
  const mockSign = crypto.sign as jest.Mock;
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully sign a message using private key from the PEM file', async () => {
    const mockKeyObject: crypto.KeyObject = {
      export: jest.fn(),
      equals: jest.fn(),
      type: 'private',
      toCryptoKey: jest.fn(),
    };
    mockReadFileSync.mockReturnValue(mockPemContent);
    mockCreatePrivateKey.mockReturnValue(mockKeyObject);
    mockSign.mockImplementation(() => mockSignature);
    const result = await pemSignImpl({
      pemFile: mockPemFilePath,
      message: mockMessage,
    });
    expect(result).toEqual(mockSignature);
  });
  it('should throw an error if the PEM file does not exist', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });
    await expect(
      pemSignImpl({
        pemFile: mockPemFilePath,
        message: mockMessage,
      }),
    ).rejects.toThrow('ENOENT: no such file or directory');
    expect(mockReadFileSync).toHaveBeenCalledWith(mockPemFilePath, 'utf8');
    expect(mockCreatePrivateKey).not.toHaveBeenCalled();
    expect(mockSign).not.toHaveBeenCalled();
  });
  it('should throw an error if the PEM file contains invalid content', async () => {
    mockReadFileSync.mockReturnValue('invalidPemContent');
    mockCreatePrivateKey.mockImplementation(() => {
      throw new Error('error:0909006C:PEMroutines:get_name: no start line');
    });
    await expect(
      pemSignImpl({ pemFile: 'invalid.pem', message: mockMessage }),
    ).rejects.toThrow(/error:0909006C:PEMroutines:get_name: no start line/i);
  });
  it('should throw an error if signing fails', async () => {
    mockSign.mockImplementation(() => {
      throw new Error('Signing Failed');
    });
    await expect(
      pemSignImpl({
        pemFile: mockPemFilePath,
        message: mockMessage,
      }),
    ).rejects.toThrow('Signing Failed');
  });
});

describe('importPrivateKey', () => {
  const mockPemFilePath = '/path/to/privatekey.pem';
  const mockAppId = '12345';
  const mockTableName = 'validTable';
  const mockResolvedPemFile = '/resolved/path/to/privatekey.pem';
  const mockDerFormat = 'der-formatted-key';
  const mockAppKeyArn = 'arn:aws:kms:region:account:key/mock-key-id';
  const mockPublicKey = 'mock-public-key';
  const mockImportToken = 'mock-import-token';
  const mockEncryptedKey = 'encrypted-key-material';
  const mockUnlinkFileSync = fs.unlinkSync as jest.Mock;
  let mockValidateInputs = jest.fn();
  let mockConvertPemToDer = jest.fn();
  let mockCreateKmsKey = jest.fn();
  let mockGetKmsImportParameters = jest.fn();
  let mockEncryptKeyMaterial = jest.fn();
  let mockImportKeyMaterialAndValidate = jest.fn();
  let mockUpdateAppsTable = jest.fn();
  beforeEach(() => {
    const mockPath = path.resolve as jest.Mock;
    mockPath.mockReturnValue(mockResolvedPemFile);
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
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should successfully import private key and delete PEM file after all steps process successfully', async () => {
    await importPrivateKey({
      pemFilePath: mockPemFilePath,
      appId: mockAppId,
      tableName: mockTableName,
      validateInputs: mockValidateInputs,
      convertPemToDer: mockConvertPemToDer,
      createKmsKey: mockCreateKmsKey,
      getKmsImportParameters: mockGetKmsImportParameters,
      encryptKeyMaterial: mockEncryptKeyMaterial,
      importKeyMaterialAndValidate: mockImportKeyMaterialAndValidate,
      updateAppsTable: mockUpdateAppsTable,
    });
    expect(resolve).toHaveBeenCalledWith(mockPemFilePath);
    expect(mockValidateInputs).toHaveBeenCalledWith({
      pemFile: mockResolvedPemFile,
      appId: mockAppId,
      tableName: mockTableName,
    });
    expect(mockConvertPemToDer).toHaveBeenCalledWith({
      pemFile: mockResolvedPemFile,
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
    expect(mockUnlinkFileSync).toHaveBeenCalledWith(mockPemFilePath);
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
    ],
    [
      'convertPemToDer',
      () => {
        mockConvertPemToDer.mockImplementation(() => {
          throw new Error('PEM to DER conversion failed');
        });
        return 'PEM to DER conversion failed';
      },
    ],
    [
      'createKmsKey',
      () => {
        mockCreateKmsKey.mockRejectedValue(
          new Error('KMS key creation failed'),
        );
        return 'KMS key creation failed';
      },
    ],
    [
      'getKmsImportParameters',
      () => {
        mockGetKmsImportParameters.mockRejectedValue(
          new Error('Failed to get import parameters'),
        );
        return 'Failed to get import parameters';
      },
    ],
    [
      'encryptKeyMaterial',
      () => {
        mockEncryptKeyMaterial.mockRejectedValue(
          new Error('Encryption failed'),
        );
        return 'Encryption failed';
      },
    ],
    [
      'importKeyMaterialAndValidate',
      () => {
        mockImportKeyMaterialAndValidate.mockRejectedValue(
          new Error('Import validation failed'),
        );
        return 'Import validation failed';
      },
    ],
    [
      'updateAppsTable',
      () => {
        mockUpdateAppsTable.mockRejectedValue(
          new Error('Failed to update apps table'),
        );
        return 'Failed to update apps table';
      },
    ],
  ])(
    'should throw error when %s fails',
    async (_: string, setupFailureAndGetError) => {
      const expectedError = setupFailureAndGetError();
      await expect(
        importPrivateKey({
          pemFilePath: mockPemFilePath,
          appId: mockAppId,
          tableName: mockTableName,
          validateInputs: mockValidateInputs,
          convertPemToDer: mockConvertPemToDer,
          createKmsKey: mockCreateKmsKey,
          getKmsImportParameters: mockGetKmsImportParameters,
          encryptKeyMaterial: mockEncryptKeyMaterial,
          importKeyMaterialAndValidate: mockImportKeyMaterialAndValidate,
          updateAppsTable: mockUpdateAppsTable,
        }),
      ).rejects.toThrow(expectedError);
    },
  );
});

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
    await expect(importKey.main()).resolves.toBeUndefined();
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Please provide GitHub App PEM file path, GitHub AppId and the table name to store the AppId and Key ARN\n\nUsage: npm run import-private-key <path-to-private-key.pem> <GitHubAppId> <TableName>\n\nNOTE: For TableName, `npm run get-table-name` should list the available tables\n',
    );
  });
});
