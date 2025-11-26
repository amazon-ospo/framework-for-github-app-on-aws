import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';

export const LAMBDA_NODE_VERSION = Runtime.NODEJS_22_X;
export const LAMBDA_DEFAULTS = {
  runtime: LAMBDA_NODE_VERSION,
  tracing: Tracing.ACTIVE,
  bundling: {
    sourceMap: true,
    // The AWS CDK defaults to loading the AWS SDK from external modules.
    // https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-lambda-nodejs.BundlingOptions.html#externalmodules
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.BundlingOptions.html#externalmodules
    // We never want to do that.
    // To ensure that we bundle the AWS SDK into Lambda artifact,
    // override the default value for externalModules.
    externalModules: [],
  },
};

// Bundling configuration for Lambdas that use re2-wasm
// re2-wasm is used by the SSDK common library to do pattern validation, and uses
// a WASM module, so it's excluded from the bundle and copied from local node_modules.
// Change this method once we figure out a better way to interact
// with the network-blocked builder system.
export const LAMBDA_DEFAULTS_WITH_RE2_WASM = {
  ...LAMBDA_DEFAULTS,
  bundling: {
    ...LAMBDA_DEFAULTS.bundling,
    externalModules: ['re2-wasm'],
    commandHooks: {
      beforeBundling: (): string[] => [],
      beforeInstall: (): string[] => [],
      afterBundling: (inputDir: string, outputDir: string): string[] => [
        `mkdir -p ${outputDir}/node_modules`,
        `cp -r ${inputDir}/node_modules/re2-wasm ${outputDir}/node_modules/`,
      ],
    },
  },
};
