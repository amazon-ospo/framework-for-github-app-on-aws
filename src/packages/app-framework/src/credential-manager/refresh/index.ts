import { Stack, Tags, Duration } from 'aws-cdk-lib';
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

export interface InstallationRefreshProps {
  readonly AppTable: ITable;
  readonly InstallationTable: ITable;
}

export class InstallationRefresher extends Construct {
  readonly lambdaHandler: NodejsFunction;
  readonly functionUrl: IFunctionUrl;
  constructor(scope: Construct, id: string, props: InstallationRefreshProps) {
    super(scope, id);

    this.lambdaHandler = new NodejsFunction(this, 'handler', {
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
      environment: {
        [EnvironmentVariables.APP_TABLE_NAME]: props.AppTable.tableName,
        [EnvironmentVariables.INSTALLATION_TABLE_NAME]:
          props.InstallationTable.tableName,
      },
      description: 'Refresh app installations',
      memorySize: 1024,
      timeout: Duration.minutes(5),
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
      TAG_VALUES.REFRESH_CACHED_DATA_ENDPOINT,
    );

    this.lambdaHandler.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:Scan',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:DeleteItem',
        ],
        resources: [props.AppTable.tableArn, props.InstallationTable.tableArn],
      }),
    );

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
  }
}
