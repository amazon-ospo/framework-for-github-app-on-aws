import { Tags } from 'aws-cdk-lib';
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
 * CDK construct that creates a Lambda function and Function URL for retrieving cached installation data.
 * This construct provides an endpoint to get GitHub App installation records from DynamoDB.
 */
export class InstallationCachedData extends Construct {
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
        nodeModules: ['re2-wasm'],
      },
      environment: {
        [EnvironmentVariables.INSTALLATION_TABLE_NAME]:
          props.InstallationTable.tableName,
      },
      description: 'Get Installations Recorded Data',
      memorySize: 512,
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
      TAG_VALUES.INSTALLATION_CACHED_DATA_ENDPOINT,
    );
    // Grant the Lambda function read access to the installation table
    props.InstallationTable.grantReadData(this.lambdaHandler);
  }
}
