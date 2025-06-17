#!/usr/bin/env node

import {
  constants,
  createCipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  publicEncrypt,
  randomBytes,
  sign,
} from 'crypto';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import {
  CreateKeyCommand,
  DescribeKeyCommand,
  GetParametersForImportCommand,
  ImportKeyMaterialCommand,
  KMSClient,
  SignCommand,
  TagResourceCommand,
} from '@aws-sdk/client-kms';
import { WRAPPING_SPEC, CREATE_KEY_SPEC, USER_AGENT } from './constants';
import { listTablesByTags } from './getTableName';

export const kms = new KMSClient({
  customUserAgent: USER_AGENT,
});
export const dynamoDB = new DynamoDBClient({
  customUserAgent: USER_AGENT,
});

export type ImportPrivateKey = ({
  pemFilePath,
  appId,
  tableName,
  validateInputs,
  convertPemToDer,
  createKmsKey,
  encryptKeyMaterial,
  importKeyMaterialAndValidate,
  updateAppsTable,
  tagKeyAsFailed,
}: {
  pemFilePath: string;
  appId: number;
  tableName: string;
  validateInputs?: ValidateInputs;
  convertPemToDer?: ConvertPemToDer;
  createKmsKey?: CreateKmsKey;
  getKmsImportParameters?: GetKmsImportParameters;
  encryptKeyMaterial?: EncryptKeyMaterial;
  importKeyMaterialAndValidate?: ImportKeyMaterialAndValidate;
  updateAppsTable?: UpdateAppsTable;
  tagKeyAsFailed?: TagKeyAsFailed;
}) => Promise<void>;

/**
 * Function that imports private key from a PEM file into AWS KMS for a GitHub App
 * and deletes the PEM file from path after successful import.
 *
 * This function performs the following steps:
 * 1. Validates the input PEM file, App ID and TableName
 * 2. Converts the PEM file to DER format
 * 3. Creates a new KMS key and tagged as active
 * 4. Retrieves KMS import parameters
 * 5. Encrypts the key material
 * 6. Imports the encrypted key material into KMS and validates it
 * 7. Updates the DynamoDB table with the KMS key ARN
 * 8. Upon rotation, old key is tagged as inactive.
 * 9. PEM file is permanently deleted from the local path provided.
 * 10. Tags failed imports created KMS keys as status "Failed"
 *
 * ---
 * dependency injection parameters:
 * @param pemFilePath Path to the PEM file containing the private key
 * @param appId GitHub App ID
 * @param validateInputs Function that checks if the provided PEM file and AppId belongs to the same GitHub App and validates if the Table exists.
 * @param convertPemToDer Function that converts PKCS#1 PEM format file to PKCS#8 DER format file.
 * @param createKmsKey Function that creates a KMS key for the imported private key and tags key as 'active'.
 * @param encryptKeyMaterial Function that encrypts the key material using public key from AWS KMS.
 * @param importKeyMaterialAndValidate Function that uses importToken to import the private key and validate JWT Auth.
 * @param updateAppsTable Function that updates the DynamoDB table with imported key ARN.
 * @param tagKeyAsFailed Function that tags failed imports created KMS keys as Failed
 *
 */
export const importPrivateKey: ImportPrivateKey = async ({
  pemFilePath,
  appId,
  tableName,
  validateInputs = validateInputsImpl,
  convertPemToDer = convertPemToDerImpl,
  createKmsKey = createKmsKeyImpl,
  getKmsImportParameters = getKmsImportParametersImpl,
  encryptKeyMaterial = encryptKeyMaterialImpl,
  importKeyMaterialAndValidate = importKeyMaterialAndValidateImpl,
  updateAppsTable = updateAppsTableImpl,
  tagKeyAsFailed = tagKeyAsFailedImpl,
}) => {
  let appKeyArn: string | undefined;
  try {
    console.log('Starting GitHub App Private Key Import Process');
    const resolvedPemFile = resolve(pemFilePath);
    await validateInputs({ pemFile: resolvedPemFile, appId, tableName });
    const privateKeyInDerFormat = convertPemToDer({ pemFile: resolvedPemFile });
    appKeyArn = await createKmsKey({ appId });
    const { publicKey, importToken } = await getKmsImportParameters({
      appKeyArn,
    });
    const encryptedKey = await encryptKeyMaterial({
      privateKeyDer: privateKeyInDerFormat,
      importParams: {
        publicKey,
        importToken,
      },
    });
    await importKeyMaterialAndValidate({
      appKeyArn,
      appId,
      wrappedMaterial: encryptedKey,
      importToken,
    });
    await updateAppsTable({ appKeyArn, appId, tableName });
    console.log(
      `Table "${tableName}" successfully updated with ${appKeyArn} for AppId ${appId}`,
    );
    // Remove PEM file from location after all steps pass successfully
    unlinkSync(pemFilePath);
    console.log('Permanently deleted PEM file from the downloaded location');
    console.log('Import Private key process completed successfully');
  } catch (error) {
    let errorMessages = [
      'Error during import process:',
      error,
      '',
      'Please fix the error and retry the import process.',
    ];
    if (appKeyArn) {
      errorMessages.push(
        'Cleanup Required:',
        `- KMS Key created but import failed: ${appKeyArn}`,
        '- Note: Cleanup needed for keys created during this failed import',
        '- Check AWS KMS for newly created keys and delete them to avoid incurring costs.',
      );
      try {
        await tagKeyAsFailed({ appKeyArn });
      } catch (tagError) {
        errorMessages.push('- Failed to tag key as "Failed":', tagError);
      }
    }
    const errorMessage = errorMessages.join('\n');
    console.error(errorMessage);
    throw error;
  }
};

type ValidateInputs = ({
  pemFile,
  appId,
  tableName,
  listTables,
  validateJWt,
  pemSign,
}: {
  pemFile: string;
  appId: number;
  tableName: string;
  listTables?: () => Promise<string[]>;
  validateJWt?: ValidateJWT;
  pemSign?: PemSign;
}) => Promise<void>;

/**
 * Function that checks the validation of GitHub App ID, PEM file, and DynamoDB table.
 * This function performs the following validations:
 * 1. Checks if the PEM file exists at the specified path
 * 2. Validates the private key and App ID combination by:
 *    - Using the private key to sign JWT tokens
 *    - Authenticating with GitHub API
 *    - Verifying the App ID matches
 * 3. Validates the existence of Table provided.
 *
 * ---
 * dependency injection parameters:
 * @param pemFile Path to the PEM file containing private key
 * @param appId GitHub App ID
 * @param tableName Table to update the KMSKey ARN.
 * @param validateJWT Function to validate JWT authentication.
 * @param pemSign Function that helps to sign messages with private key.
 * @returns Returns if GitHub authentication is successful, throws error otherwise.
 */
export const validateInputsImpl: ValidateInputs = async ({
  pemFile,
  appId,
  tableName,
  listTables = listTablesByTags,
  validateJWt = validateJWTImpl,
  pemSign = pemSignImpl,
}) => {
  try {
    if (!existsSync(pemFile)) {
      throw new Error(`File not found at the path: ${pemFile}`);
    }
    console.log(`PEM file found at path: ${pemFile}`);
    const authSuccess = await validateJWt({
      appId,
      signFunction: (message) => pemSign({ pemFile, message }),
    });
    if (!authSuccess) {
      throw new Error(
        'GitHub authentication failed - invalid private key or App ID mismatch',
      );
    }
    const validTables = await listTables();
    if (!validTables.includes(tableName)) {
      throw new Error(
        `Invalid table name provided. Table "${tableName}" is not in the list of tables`,
      );
    }
    console.log('PEM file path, App ID and Table Name validated successfully');
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
};

type ConvertPemToDer = ({ pemFile }: { pemFile: string }) => Buffer;

/**
 * Function that does conversion of PKCS#1 PEM format private key to PKCS#8 DER format private key.
 * GitHub private keys are of PKCS#1 format
 * Docs for GitHub: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps#generating-private-keys
 * AWS KMS expects RSA private keys of PKCS#8 format
 * Docs for AWS KMS: https://docs.aws.amazon.com/kms/latest/developerguide/importing-keys-conceptual.html
 *
 * @param pemFile Path to the PEM file containing private key
 * @returns Private key in DER format as a Buffer
 */
export const convertPemToDerImpl: ConvertPemToDer = ({ pemFile }) => {
  const pemContent = readFileSync(pemFile, 'utf8');
  return createPrivateKey(pemContent).export({
    type: 'pkcs8',
    format: 'der',
  });
};

type CreateKmsKey = ({ appId }: { appId: number }) => Promise<string>;

/**
 * Function that creates an external AWS KMS key configured for GitHub App signing.
 * Configurations:
 * - KeySpec: Specified by CREATE_KEY_SPEC constant
 * - KeyUsage: SIGN_VERIFY
 * - Origin: EXTERNAL
 * - Tags: Status, CreatedOn, AppId, and FrameworkForGitHubAppOnAwsManaged
 *
 * @param appId GitHub App ID to associate with the KMS key
 * @returns The ARN of the created KMS key
 */
export const createKmsKeyImpl: CreateKmsKey = async ({ appId }) => {
  const createKeyResponse = await kms.send(
    new CreateKeyCommand({
      KeySpec: CREATE_KEY_SPEC,
      KeyUsage: 'SIGN_VERIFY',
      Origin: 'EXTERNAL',
      Description: `GitHub App Signing key for App ID ${appId}`,
      Tags: [
        {
          TagKey: 'Status',
          TagValue: 'Active',
        },
        {
          TagKey: 'CreatedOn',
          TagValue: new Date().toISOString(),
        },
        {
          TagKey: 'AppId',
          TagValue: appId.toString(),
        },
        {
          TagKey: 'FrameworkForGitHubAppOnAwsManaged',
          TagValue: 'true',
        },
      ],
    }),
  );
  if (!createKeyResponse.KeyMetadata?.KeyId) {
    throw new Error('Failed to create KMS key');
  }
  const keyId = createKeyResponse.KeyMetadata.KeyId;
  const describeKeyResponse = await kms.send(
    new DescribeKeyCommand({ KeyId: keyId }),
  );

  const appKeyArn = describeKeyResponse.KeyMetadata?.Arn;
  if (!appKeyArn) {
    throw new Error('Failed to retrieve KMS Key Arn');
  }
  console.log(
    `Created new KMS key with ARN ${appKeyArn} for GitHub AppId: ${appId}`,
  );
  return appKeyArn;
};

type GetKmsImportParameters = ({
  appKeyArn,
}: {
  appKeyArn: string;
}) => Promise<{
  publicKey: Uint8Array;
  importToken: Uint8Array;
}>;

/**
 * Function that retrieves KMS import parameters public key and import token
 * using RSA AES key wrapping.
 *
 * @param appKeyArn ARN of the KMS key
 * @returns Object containing:
 *   - publicKey: The public key to use for wrapping the import material
 *   - importToken: The import token required for the import operation
 */
export const getKmsImportParametersImpl: GetKmsImportParameters = async ({
  appKeyArn,
}) => {
  const importParams = await kms.send(
    new GetParametersForImportCommand({
      KeyId: appKeyArn,
      WrappingAlgorithm: 'RSA_AES_KEY_WRAP_SHA_256',
      WrappingKeySpec: WRAPPING_SPEC,
    }),
  );

  if (!importParams.PublicKey || !importParams.ImportToken) {
    throw new Error('Failed to retrieve wrapping key or import token');
  }

  return {
    publicKey: importParams.PublicKey,
    importToken: importParams.ImportToken,
  };
};

type EncryptKeyMaterial = ({
  privateKeyDer,
  importParams,
  wrapKeyMaterial,
}: {
  privateKeyDer: Buffer;
  importParams: {
    publicKey: Uint8Array;
    importToken: Uint8Array;
  };
  wrapKeyMaterial?: WrapKeyMaterial;
}) => Promise<Buffer>;

/**
 * Function that encrypts key material for import into AWS KMS
 *
 * ---
 * dependency injection parameters:
 *
 * @param privateKeyDer Private key in DER format.
 * @param importParams Import parameters from KMS.
 * @param wrapKeyMaterial Function to wrap key material.
 * @returns Encrypted key material ready for import.
 */
export const encryptKeyMaterialImpl: EncryptKeyMaterial = async ({
  privateKeyDer,
  importParams,
  wrapKeyMaterial = wrapKeyMaterialImpl,
}) => {
  try {
    const aesKey = randomBytes(32);
    const wrappedKey = wrapKeyMaterial({ keyMaterial: privateKeyDer, aesKey });
    const publicKey = createPublicKey({
      key: Buffer.from(importParams.publicKey),
      format: 'der',
      type: 'spki',
    });

    const encryptedAesKey = publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey,
    );

    return Buffer.concat([encryptedAesKey, wrappedKey]);
  } catch (error) {
    throw error;
  }
};

export type WrapKeyMaterial = ({
  keyMaterial,
  aesKey,
}: {
  keyMaterial: Buffer;
  aesKey: Buffer;
}) => Buffer;

/**
 * Implements the AES key wrap with padding algorithm for wrapping key material.
 *
 * This function performs the following steps:
 * 1. Validates that the key material is not empty
 * 2. Creates a cipher using AES-256 key wrap with padding (id-aes256-wrap-pad)
 * 3. Uses a static IV of 'A65959A6' as per the AES key wrap algorithm specification
 *    Docs: https://www.rfc-editor.org/rfc/rfc5649.html
 * 4. Wraps the key material using the cipher
 *
 * ---
 * dependency injection parameters:
 *
 * @param keyMaterial The key material to be wrapped.
 * @param aesKey  The AES key used for wrapping.
 * @returns Wrapped Key Material.
 */
export const wrapKeyMaterialImpl: WrapKeyMaterial = ({
  keyMaterial,
  aesKey,
}) => {
  if (!keyMaterial || keyMaterial.length === 0) {
    throw new Error('Key material cannot be empty');
  }
  const cipher = createCipheriv(
    'id-aes256-wrap-pad',
    aesKey,
    Buffer.from('A65959A6', 'hex'),
  );
  return Buffer.concat([cipher.update(keyMaterial), cipher.final()]);
};

type ImportKeyMaterialAndValidate = ({
  appKeyArn,
  appId,
  wrappedMaterial,
  importToken,
  kmsSign,
  validateJWT,
}: {
  appKeyArn: string;
  appId: number;
  wrappedMaterial: Buffer;
  importToken: Uint8Array;
  kmsSign?: KmsSign;
  validateJWT?: ValidateJWT;
}) => Promise<void>;

/**
 * Function that imports key material into KMS and validates JWT Auth.
 *
 * ---
 * dependency injection parameters:
 *
 * @param appKeyArn ARN of the KMS key
 * @param appId GitHub App ID
 * @param wrappedMaterial Encrypted key material to import
 * @param importToken Import token from KMS
 * @param kmsSign Function for KMS signing
 * @param validateJWT Function for JWT validation
 */
export const importKeyMaterialAndValidateImpl: ImportKeyMaterialAndValidate =
  async ({
    appKeyArn,
    appId,
    wrappedMaterial,
    importToken,
    kmsSign = kmsSignImpl,
    validateJWT = validateJWTImpl,
  }) => {
    try {
      await kms.send(
        new ImportKeyMaterialCommand({
          KeyId: appKeyArn,
          EncryptedKeyMaterial: wrappedMaterial,
          ImportToken: importToken,
          ExpirationModel: 'KEY_MATERIAL_DOES_NOT_EXPIRE',
        }),
      );
      const authSuccess = await validateJWT({
        appId,
        signFunction: (message) => kmsSign({ appKeyArn, message }),
      });
      if (!authSuccess) {
        throw new Error(
          'Key material import successful but JWT authentication failed',
        );
      }
      console.log(
        `Key material imported successfully and verified JWT signing for KMS key ARN: ${appKeyArn}`,
      );
    } catch (error) {
      throw error;
    }
  };

type UpdateAppsTable = ({
  appKeyArn,
  appId,
  tableName,
  tagOldKeyArn,
}: {
  appKeyArn: string;
  appId: number;
  tableName: string;
  tagOldKeyArn?: TagOldKeyArn;
}) => Promise<void>;

/**
 * Function that updates DynamoDB table with appId and AWS key ARN,
 * also includes tagging of old key as Inactive upon rotation.
 *
 * ---
 * dependency injection parameters:
 *
 * @param appKeyArn ARN of the new KMS key
 * @param appId GitHub App ID
 * @param tableName Table to update the KMSKey ARN and App ID
 * @param tagOldKeyArn Function to tag the old key as Inactive if rotation
 */
export const updateAppsTableImpl: UpdateAppsTable = async ({
  appKeyArn,
  appId,
  tableName,
  tagOldKeyArn = tagOldKeyArnImpl,
}) => {
  try {
    const putResult = await dynamoDB.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          AppId: { N: appId.toString() },
          KmsKeyArn: { S: appKeyArn },
        },
        ReturnValues: 'ALL_OLD',
      }),
    );
    if (!!putResult.Attributes && !!putResult.Attributes?.KmsKeyArn?.S) {
      const oldKeyArn = putResult.Attributes.KmsKeyArn.S;
      try {
        await tagOldKeyArn({ oldKeyArn, appKeyArn, appId });
      } catch (error) {
        throw error;
      }
    }
  } catch (error) {
    throw error;
  }
};

export type TagOldKeyArn = ({
  oldKeyArn,
  appKeyArn,
  appId,
}: {
  oldKeyArn: string;
  appKeyArn: string;
  appId: number;
}) => Promise<void>;

/**
 * Function that tags old KMS key with replacement information.
 *
 * ---
 * @param oldKeyArn ARN of the old key being replaced
 * @param appKeyArn ARN of the new key
 * @param appId GitHub App ID
 */
export const tagOldKeyArnImpl: TagOldKeyArn = async ({
  oldKeyArn,
  appKeyArn,
  appId,
}) => {
  await kms.send(
    new TagResourceCommand({
      KeyId: oldKeyArn,
      Tags: [
        {
          TagKey: 'Status',
          TagValue: 'Inactive',
        },
        {
          TagKey: 'ReplacedBy',
          TagValue: appKeyArn,
        },
        {
          TagKey: 'ReplacedOn',
          TagValue: new Date().toISOString(),
        },
        {
          TagKey: 'AppId',
          TagValue: appId.toString(),
        },
        {
          TagKey: 'FrameworkForGitHubAppOnAwsManaged',
          TagValue: 'true',
        },
      ],
    }),
  );
  console.log(`Successfully tagged old key ${oldKeyArn} as Inactive`);
};

export type TagKeyAsFailed = ({
  appKeyArn,
}: {
  appKeyArn: string;
}) => Promise<void>;

/**
 * Function that tags failed imports created KMS keys as Failed.
 *
 * ---
 * @param appKeyArn ARN of the new key created
 */
export const tagKeyAsFailedImpl: TagKeyAsFailed = async ({ appKeyArn }) => {
  await kms.send(
    new TagResourceCommand({
      KeyId: appKeyArn,
      Tags: [
        {
          TagKey: 'Status',
          TagValue: 'Failed',
        },
        {
          TagKey: 'Failed At',
          TagValue: new Date().toISOString(),
        },
      ],
    }),
  );
};

export type ValidateJWT = ({
  appId,
  signFunction,
}: {
  appId: number;
  signFunction: (message: string) => Promise<Buffer>;
}) => Promise<boolean>;

/**
 * Function that validates JWT authentication with GitHub API using provided signing function.
 * Docs: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app
 *
 * The signFunction parameter is abstracted to support below signing methods:
 * - signing with a private key from PEM file
 * - signing with a private key from AWS KMS
 *
 * ---
 * @param appId GitHub App ID
 * @param signFunction Function to sign JWT with private key from both PEM file and AWS KMS .
 * @returns True if validation succeeds, false otherwise.
 */
export const validateJWTImpl: ValidateJWT = async ({ appId, signFunction }) => {
  try {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60,
      exp: now + 10 * 60,
      iss: appId,
    };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = await signFunction(signingInput);
    const encodedSignature = signature.toString('base64url');
    const jwt = `${signingInput}.${encodedSignature}`;
    const response = await fetch('https://api.github.com/app', {
      headers: {
        // eslint-disable-next-line quote-props
        Authorization: `Bearer ${jwt}`,
        // eslint-disable-next-line quote-props
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return false;
    }
    const data = (await response.json()) as { id: number; name: string };
    if (data.id !== appId) {
      console.error(`App ID mismatch: Expected ${appId}, got ${data.id}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('JWT Authentication Failed:', error);
    return false;
  }
};

export type KmsSign = ({
  appKeyArn,
  message,
}: {
  appKeyArn: string;
  message: string;
}) => Promise<Buffer>;

/**
 * Function that signs a message using key that was imported in AWS KMS.
 *
 * Note: This function uses the RSASSA-PKCS1-v1_5 signing algorithm with SHA-256.
 *
 * ---
 * @param appKeyArn ARN of the new key.
 * @param message The message to be signed.
 * @returns The signature as a Buffer
 */
export const kmsSignImpl: KmsSign = async ({ appKeyArn, message }) => {
  const messageHash = createHash('sha256').update(message).digest();
  const signResponse = await kms.send(
    new SignCommand({
      KeyId: appKeyArn,
      Message: messageHash,
      MessageType: 'DIGEST',
      SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
    }),
  );

  if (!signResponse.Signature || signResponse.Signature.length === 0) {
    throw new Error('KMS signing failed: Signature is missing or empty');
  }
  return Buffer.from(signResponse.Signature);
};

export type PemSign = ({
  pemFile,
  message,
}: {
  pemFile: string;
  message: string;
}) => Promise<Buffer>;

/**
 * Function that does message signing using a private key from a PEM file.
 *
 * Note: Uses Node.js crypto module's sign function with SHA-256 algorithm
 *
 * ---
 * @param pemFile Path to the PEM file containing private key.
 * @param message Message to be signed.
 * @returns The signature as a Buffer
 */
export const pemSignImpl: PemSign = async ({ pemFile, message }) => {
  const pemContent = readFileSync(pemFile, 'utf8');
  const privateKey = createPrivateKey(pemContent);
  return sign('sha256', Buffer.from(message), {
    key: privateKey,
  });
};

export async function main(): Promise<void> {
  const [, , pemFilePath, appIdAsString, tableName] = process.argv;
  if (!pemFilePath || !appIdAsString || !tableName) {
    const errorMessage = [
      'Please provide GitHub App PEM file path, GitHub AppId and the table name to store the AppId and Key ARN',
      'Usage: npm run import-private-key <path-to-private-key.pem> <GitHubAppId> <TableName>',
      'NOTE: For TableName, `npm run get-table-name` should list the available tables',
      '',
    ].join('\n\n');

    console.error(errorMessage);
    process.exit(1);
  }
  const appId = Number(appIdAsString);
  if (isNaN(appId)) {
    console.error('Error: GitHub AppId must be a valid number');
    process.exit(1);
  }
  try {
    await importPrivateKey({ pemFilePath, appId, tableName });
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
