import { Duration } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { LAMBDA_DEFAULTS } from '../../lambdaDefaults';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { EnvironmentVariables } from '../constants';

export interface InstallationTrackerProps {
  readonly AppTable: ITable;
  readonly InstallationTable: ITable;
}

export class InstallationTracker {
  constructor(scope: Construct, _id: string, props: InstallationTrackerProps) {
    const rule = new Rule(scope, 'installationTrackerRule', {
      schedule: Schedule.rate(Duration.minutes(5)),
      enabled: true,
    });

    const installationTrackerFunction = new NodejsFunction(scope, 'handler', {
      ...LAMBDA_DEFAULTS,
      functionName: 'InstallationTracker',
      bundling: {
        ...LAMBDA_DEFAULTS.bundling,
        nodeModules: ['re2-wasm'],
      },
      environment: {
        [EnvironmentVariables.APP_TABLE_NAME]:
          props.AppTable.tableName,
        [EnvironmentVariables.INSTALLATION_TABLE_NAME]:
          props.InstallationTable.tableName,
      },
      description: 'Tracks app installations',
      memorySize: 512,
    });

    rule.addTarget(new LambdaFunction(installationTrackerFunction));

    installationTrackerFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["dynamodb:Scan", "dynamodb:GetItem", "dynamodb:PutItem", "kms:Sign", "lambda:Invoke"],
        resources: [
          `*`,
        ]
      })
    );
  }
}
