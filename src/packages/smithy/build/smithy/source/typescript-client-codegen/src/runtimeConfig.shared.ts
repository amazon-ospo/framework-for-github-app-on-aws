// smithy-typescript generated code
import { defaultAppFrameworkHttpAuthSchemeProvider } from "./auth/httpAuthSchemeProvider";
import { SigV4Signer } from "@smithy/experimental-identity-and-auth";
import { NoOpLogger } from "@smithy/smithy-client";
import { IdentityProviderConfig } from "@smithy/types";
import { parseUrl } from "@smithy/url-parser";
import {
  fromBase64,
  toBase64,
} from "@smithy/util-base64";
import {
  fromUtf8,
  toUtf8,
} from "@smithy/util-utf8";
import { AppFrameworkClientConfig } from "./AppFrameworkClient";

/**
 * @internal
 */
export const getRuntimeConfig = (config: AppFrameworkClientConfig) => {
  return {
    apiVersion: "2024-08-23",
      base64Decoder: config?.base64Decoder ?? fromBase64,
  base64Encoder: config?.base64Encoder ?? toBase64,
  disableHostPrefix: config?.disableHostPrefix ?? false,
  extensions: config?.extensions ?? [],
  httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultAppFrameworkHttpAuthSchemeProvider,
  httpAuthSchemes: config?.httpAuthSchemes ?? [{
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc: IdentityProviderConfig) =>
          ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new SigV4Signer(),
      }],
  logger: config?.logger ?? new NoOpLogger(),
  signingName: config?.signingName ?? "lambda",
  urlParser: config?.urlParser ?? parseUrl,
  utf8Decoder: config?.utf8Decoder ?? fromUtf8,
  utf8Encoder: config?.utf8Encoder ?? toUtf8,
  }
};
