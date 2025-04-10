// @ts-nocheck
// smithy-typescript generated code
import { AppFrameworkClientResolvedConfig } from "../AppFrameworkClient";
import {
  doesIdentityRequireRefresh,
  isIdentityExpired,
  memoizeIdentityProvider,
} from "@smithy/core";
import {
  AwsCredentialIdentity,
  AwsCredentialIdentityProvider,
  HandlerExecutionContext,
  HttpAuthOption,
  HttpAuthScheme,
  HttpAuthSchemeParameters,
  HttpAuthSchemeParametersProvider,
  HttpAuthSchemeProvider,
  Provider as __Provider,
} from "@smithy/types";
import {
  getSmithyContext,
  normalizeProvider,
} from "@smithy/util-middleware";

/**
 * @internal
 */
export interface AppFrameworkHttpAuthSchemeParameters extends HttpAuthSchemeParameters {
  region?: string;
}

/**
 * @internal
 */
export interface AppFrameworkHttpAuthSchemeParametersProvider extends HttpAuthSchemeParametersProvider<AppFrameworkClientResolvedConfig, HandlerExecutionContext, AppFrameworkHttpAuthSchemeParameters, object> {}

/**
 * @internal
 */
export const defaultAppFrameworkHttpAuthSchemeParametersProvider = async (config: AppFrameworkClientResolvedConfig, context: HandlerExecutionContext, input: object): Promise<AppFrameworkHttpAuthSchemeParameters> => {
  return {
    operation: getSmithyContext(context).operation as string,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })(),
  };
};

function createAwsAuthSigv4HttpAuthOption(authParameters: AppFrameworkHttpAuthSchemeParameters): HttpAuthOption {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "execute-api",
      region: authParameters.region,
    },
    propertiesExtractor: (config, context) => {
      return {
        /**
         * @internal
         */
        signingProperties: {
          context,
        },
      };
    },
  };
};

/**
 * @internal
 */
export interface AppFrameworkHttpAuthSchemeProvider extends HttpAuthSchemeProvider<AppFrameworkHttpAuthSchemeParameters> {}

/**
 * @internal
 */
export const defaultAppFrameworkHttpAuthSchemeProvider: AppFrameworkHttpAuthSchemeProvider = (authParameters) => {
  const options: HttpAuthOption[] = [];
  switch (authParameters.operation) {
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
    };
  };
  return options;
};

/**
 * @internal
 */
export interface HttpAuthSchemeInputConfig {
  /**
   * Configuration of HttpAuthSchemes for a client which provides default identity providers and signers per auth scheme.
   * @internal
   */
  httpAuthSchemes?: HttpAuthScheme[];

  /**
   * Configuration of an HttpAuthSchemeProvider for a client which resolves which HttpAuthScheme to use.
   * @internal
   */
  httpAuthSchemeProvider?: AppFrameworkHttpAuthSchemeProvider;

  /**
   * The credentials used to sign requests.
   */
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider;
  /**
   * The AWS region to which this client will send requests.
   */
  region?: string | __Provider<string>;
}

/**
 * @internal
 */
export interface HttpAuthSchemeResolvedConfig {
  /**
   * Configuration of HttpAuthSchemes for a client which provides default identity providers and signers per auth scheme.
   * @internal
   */
  readonly httpAuthSchemes: HttpAuthScheme[];

  /**
   * Configuration of an HttpAuthSchemeProvider for a client which resolves which HttpAuthScheme to use.
   * @internal
   */
  readonly httpAuthSchemeProvider: AppFrameworkHttpAuthSchemeProvider;

  /**
   * The credentials used to sign requests.
   */
  readonly credentials?: AwsCredentialIdentityProvider;
  /**
   * The AWS region to which this client will send requests.
   */
  readonly region?: __Provider<string>;
}

/**
 * @internal
 */
export const resolveHttpAuthSchemeConfig = <T>(config: T & HttpAuthSchemeInputConfig): T & HttpAuthSchemeResolvedConfig => {
  const credentials = memoizeIdentityProvider(config.credentials, isIdentityExpired, doesIdentityRequireRefresh);
  const region = config.region ? normalizeProvider(config.region) : undefined;
  return {
    ...config,
    credentials,
    region,
  } as T & HttpAuthSchemeResolvedConfig;
};
