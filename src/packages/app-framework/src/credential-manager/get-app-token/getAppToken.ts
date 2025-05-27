import { createHash } from 'crypto';
import { KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { USER_AGENT } from './constants';
import { getAppKeyArnByIdImpl, GetAppKeyArnById } from '../../data';
import { GitHubError, ServerError, VisibleError } from '../../error';
import { GitHubAPIService } from '../../gitHubService';

export const kms = new KMSClient({
  customUserAgent: USER_AGENT,
});

export type GetAppToken = ({
  appId,
  tableName,
  getAppKeyArnbyId,
  kmsSign,
  validateAppToken,
}: {
  appId: number;
  tableName: string;
  getAppKeyArnbyId?: GetAppKeyArnById;
  kmsSign?: KmsSign;
  validateAppToken?: ValidateAppToken;
}) => Promise<{ appToken: string; expiration_time: Date }>;
/**
 * Generates a signed App Token using AWS KMS and validates it against the GitHub App API.
 *
 * This function creates an App token with the RS256 algorithm, signs it using a KMS key associated with the GitHub App,
 * and verifies the token by making a request to GitHub’s App endpoint to ensure the app ID matches.
 *
 ---
 @param appId ID of the GitHub App.
 @param tableName Name of the table storing key information.
 @param getAppKeyArnbyId Function to retrieve the KMS key ARN for the given app ID.
 @param kmsSign Function to sign the App token using AWS KMS.
 @param validateAppToken Function to validate the App token via GitHub's API.
 @returns A valid App token as a string and a expiration time in ISO8601 format.
 @throws Error if App token generation or validation fails.
 */
export const getAppTokenImpl: GetAppToken = async ({
  appId,
  tableName,
  getAppKeyArnbyId = getAppKeyArnByIdImpl,
  kmsSign = kmsSignImpl,
  validateAppToken = validateAppTokenImpl,
}) => {
  try {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 10 * 60;
    const payload = {
      iat: now - 60,
      exp,
      iss: appId,
    };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    console.log(`Getting AppKeyArn By ID ! ${appId} ${tableName}`);
    const appKeyArn = await getAppKeyArnbyId({ appId, tableName });
    console.log(`Getting KMS to sign ! ${appKeyArn} ${signingInput}`);
    const signature = await kmsSign({ appKeyArn, message: signingInput });
    const encodedSignature = signature.toString('base64url');
    const appToken = `${signingInput}.${encodedSignature}`;
    console.log(`Validating AppToken ! ${appId} ${appToken}`);
    await validateAppToken({ appId, appToken });
    // Add buffer of 10 sec to the returned expiration time
    console.log(`Successfully retrieved AppToken! ${appId} ${appToken}`);
    return { appToken, expiration_time: new Date(exp * 1000) };
  } catch (error) {
    if (error instanceof VisibleError) {
      throw error;
    }
    console.error('App Token Authentication Failed:', error);
    throw new ServerError('Failed to generate App token');
  }
};

export type ValidateAppToken = ({
  appId,
  appToken,
}: {
  appId: number;
  appToken: string;
}) => Promise<void>;
/**
 *  Validates App token by sending it to the GitHub App API.
 *
 ---
 @param appId ID of the GitHub App expected in the response.
 @param appToken The App Token to be validated.
 @returns A boolean indicating whether the App token is valid.
 */
export const validateAppTokenImpl: ValidateAppToken = async ({
  appId,
  appToken,
}) => {
  try {
    const githubService = new GitHubAPIService({
      appToken,
      userAgent: 'KMS-Key-Importer/1.0',
    });
    const data = await githubService.getAuthenticatedApp({});
    if (!!data && data.id !== appId) {
      throw new GitHubError(
        `App ID mismatch: Expected ${appId}, got ${data.id}`,
      );
    }
  } catch (error) {
    throw new GitHubError(`App token Authentication Failed: ${error}`);
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
  console.log(`Signing appKeyARN ${appKeyArn} with message ${message} - creating hash`);
  const messageHash = createHash('sha256').update(message).digest();
  console.log(`Signing appKeyARN ${appKeyArn} with message ${message} - creating successfully created hash ${messageHash.toString()}`);

  try {
    const signResponse = await kms.send(
      new SignCommand({
        KeyId: appKeyArn,
        Message: messageHash,
        MessageType: 'DIGEST',
        SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
      }),
    );
    if (!signResponse.Signature || signResponse.Signature.length === 0) {
      throw new ServerError('KMS signing failed: Signature is missing or empty');
    }
    return Buffer.from(signResponse.Signature);
  } catch (error) {
    console.log(`Call to KMS:Send failed with error ${error}`);
  }

  return Buffer.from("");
};
