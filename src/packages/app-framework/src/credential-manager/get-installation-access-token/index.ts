import { CfnOutput, Stack } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  FunctionUrlAuthType,
  HttpMethod,
  IFunctionUrl,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { InstallationAccessTokenEnvironmentVariables } from './constants';
import { LAMBDA_DEFAULTS } from '../../lambdaDefaults';

export interface InstallationAcessTokenProps {
  readonly AppTable: ITable;
  readonly InstallationTable: ITable;
}
export class InstallationAcessTokenGenerator extends Construct {
  readonly lambdaHandler: NodejsFunction;
  readonly functionUrl: IFunctionUrl;
  constructor(
    scope: Construct,
    id: string,
    props: InstallationAcessTokenProps,
  ) {
    super(scope, id);
    this.lambdaHandler = new NodejsFunction(this, 'handler', {
      ...LAMBDA_DEFAULTS,
      bundling: {
        ...LAMBDA_DEFAULTS.bundling,
        nodeModules: ['re2-wasm'],
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        [InstallationAccessTokenEnvironmentVariables.APP_TABLE_NAME]:
          props.AppTable.tableName,
        [InstallationAccessTokenEnvironmentVariables.INSTALLATIONS_TABLE_NAME]:
          props.InstallationTable.tableName,
      },
      description: 'Generates Installation Access Token',
      memorySize: 512,
    });

    this.functionUrl = this.lambdaHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.AWS_IAM,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [HttpMethod.ALL],
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
            'aws:ResourceTag/FrameworkForGitHubAppOnAwsManaged': 'true',
            'aws:ResourceTag/Status': 'Active',
          },
        },
      }),
    );

    new CfnOutput(this, 'InstallationAccessLambdaUrl', {
      value: this.functionUrl.url,
    });

    props.AppTable.grantReadData(this.lambdaHandler);
    props.InstallationTable.grantReadData(this.lambdaHandler);
  }
}
