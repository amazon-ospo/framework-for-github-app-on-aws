import { Duration, Stack } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { LAMBDA_DEFAULTS } from '../../lambdaDefaults';
import { EnvironmentVariables, TAG_KEYS, TAG_VALUES } from '../constants';

export interface InstallationTrackerProps {
  readonly AppTable: ITable;
  readonly InstallationTable: ITable;
}

export class InstallationTracker extends Construct {
  constructor(scope: Construct, id: string, props: InstallationTrackerProps) {
    super(scope, id);
    const rule = new Rule(this, 'installationTrackerRule', {
      schedule: Schedule.rate(Duration.minutes(30)),
      enabled: true,
    });

    const installationTrackerFunction = new NodejsFunction(this, 'handler', {
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
      description: 'Tracks app installations',
      memorySize: 1024,
      timeout: Duration.minutes(5),
    });

    rule.addTarget(new LambdaFunction(installationTrackerFunction));

    installationTrackerFunction.addToRolePolicy(
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

    installationTrackerFunction.addToRolePolicy(
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
