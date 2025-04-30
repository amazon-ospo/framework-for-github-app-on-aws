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
