import { Duration, Stack, Tags } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  FunctionUrlAuthType,
  HttpMethod,
  IFunctionUrl,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { EnvironmentVariables } from './constants';
import { LAMBDA_DEFAULTS } from '../../lambdaDefaults';
import { TAG_KEYS, TAG_VALUES } from '../constants';

export interface GitHubAppTokenProps {
  readonly appTableName: string;
  readonly installationTableName: string;
}
export class GitHubAppToken extends Construct {
  readonly lambdaHandler: NodejsFunction;
  readonly functionUrl: IFunctionUrl;

  constructor(scope: Construct, id: string, props: GitHubAppTokenProps) {
    super(scope, id);
    // Create Lambda function for GetAppToken API
    this.lambdaHandler = new NodejsFunction(this, 'handler', {
      ...LAMBDA_DEFAULTS,
      bundling: {
        ...LAMBDA_DEFAULTS.bundling,
        // re2-wasm is used by the SSDK common library to do pattern validation, and uses
        // a WASM module, so it's excluded from the bundle
        nodeModules: ['re2-wasm'],
      },
      environment: {
        [EnvironmentVariables.APP_TABLE_NAME]: props.appTableName,
        [EnvironmentVariables.INSTALLATION_TABLE_NAME]:
          props.installationTableName,
      },
      description: 'Processes events for getting App token.',
      memorySize: 512,
      timeout: Duration.seconds(10),
    });
    // Enable Function URL
    this.functionUrl = this.lambdaHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.AWS_IAM,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [HttpMethod.POST],
        allowedHeaders: ['*'],
      },
    });
    // Add KMS Sign permission
    this.lambdaHandler.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Sign'],
        resources: [
          `arn:aws:kms:${Stack.of(this).region}:${Stack.of(this).account}:key/*`,
        ],
        conditions: {
          StringEquals: {
            [`aws:ResourceTag/${TAG_KEYS.FRAMEWORK_FOR_GITHUB_APP_ON_AWS_MANAGED}`]:
              TAG_VALUES.TRUE,
            [`aws:ResourceTag/${TAG_KEYS.STATUS}`]: TAG_VALUES.ACTIVE,
          },
        },
      }),
    );
    Tags.of(this.functionUrl).add(
      TAG_KEYS.CREDENTIAL_MANAGER,
      TAG_VALUES.APP_TOKEN_ENDPOINT,
    );
  }
}
