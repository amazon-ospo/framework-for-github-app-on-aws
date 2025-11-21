import { Tags, Duration } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import {
  FunctionUrlAuthType,
  HttpMethod,
  IFunctionUrl,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { LAMBDA_DEFAULTS } from '../../lambdaDefaults';
import { EnvironmentVariables, TAG_KEYS, TAG_VALUES } from '../constants';

export interface InstallationCachedDataProps {
  // DynamoDB table containing installation data
  readonly InstallationTable: ITable;
}

/**
 * CDK construct that creates a Lambda function and Function URL for retrieving all installations.
 * This construct provides an endpoint to get GitHub App installation records from DynamoDB.
 */
export class GetInstallations extends Construct {
  // The Lambda function that handles installation data requests
  readonly lambdaHandler: NodejsFunction;
  // The Function URL for invoking the Lambda function
  readonly functionUrl: IFunctionUrl;
  constructor(
    scope: Construct,
    id: string,
    props: InstallationCachedDataProps,
  ) {
    super(scope, id);
    // Create Lambda function for handling installation data requests
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
        [EnvironmentVariables.INSTALLATION_TABLE_NAME]:
          props.InstallationTable.tableName,
      },
      description: 'Get all Installations',
      memorySize: 512,
      timeout: Duration.minutes(1),
    });

    // Create Function URL for the Lambda function with IAM authentication
    this.functionUrl = this.lambdaHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.AWS_IAM,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [HttpMethod.POST],
        allowedHeaders: ['*'],
      },
    });
    // Add tags to the Function URL for resource management
    Tags.of(this.functionUrl).add(
      TAG_KEYS.CREDENTIAL_MANAGER,
      TAG_VALUES.INSTALLATIONS_ENDPOINT,
    );
    // Grant the Lambda function read access to the installation table
    props.InstallationTable.grantReadData(this.lambdaHandler);
  }
}
