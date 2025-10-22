import {Duration, Stack, Tags} from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  FunctionUrlAuthType,
  HttpMethod,
  IFunctionUrl,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { LAMBDA_DEFAULTS } from '../../lambdaDefaults';
import { EnvironmentVariables, TAG_KEYS, TAG_VALUES } from '../constants';

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
        [EnvironmentVariables.APP_TABLE_NAME]: props.AppTable.tableName,
        [EnvironmentVariables.INSTALLATION_TABLE_NAME]:
          props.InstallationTable.tableName,
      },
      description: 'Generates Installation Access Token',
      memorySize: 512,
      timeout: Duration.seconds(30),
    });

    this.functionUrl = this.lambdaHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.AWS_IAM,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [HttpMethod.POST],
        allowedHeaders: ['*'],
      },
    });
    Tags.of(this.functionUrl).add(
      TAG_KEYS.CREDENTIAL_MANAGER,
      TAG_VALUES.INSTALLATION_ACCESS_TOKEN_ENDPOINT,
    );

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

    props.AppTable.grantReadData(this.lambdaHandler);
    props.InstallationTable.grantReadData(this.lambdaHandler);
  }
}
