import { Duration, Tags } from 'aws-cdk-lib';
import {
  FunctionUrlAuthType,
  IFunctionUrl,
  Runtime,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { EnvironmentVariables } from './constants';

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
      runtime: Runtime.NODEJS_18_X,
      tracing: Tracing.ACTIVE,
      bundling: {
        sourceMap: true,
        externalModules: [],
        minify: true,
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
      memorySize: 1024,
      timeout: Duration.seconds(10),
    });
    // Enable Function URL
    this.functionUrl = this.lambdaHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.AWS_IAM,
    });
    Tags.of(this.functionUrl).add('CredentialManager', 'AppTokenEndpoint');
  }
}
