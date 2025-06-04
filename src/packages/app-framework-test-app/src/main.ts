import { CredentialManager } from '@aws/framework-for-github-app-on-aws';
import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// CDK App entry for @aws/framework-for-github-app-on-aws acceptance test.
// This stack is intended for testing @aws/framework-for-github-app-on-aws library.
// In a real use case, it should be a stack defined by customer.
export class TheAppFrameworkTestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const credentialManager = new CredentialManager(
      this,
      'CredentialManager',
      {},
    );
    const appTokenUrl = credentialManager.appTokenEndpoint;
    const installationAccessTokenUrl =
      credentialManager.installationAccessTokenEndpoint;
    new CfnOutput(this, 'AppTokenEndpoint', {
      value: appTokenUrl,
      exportName: 'AppTokenEndpoint',
    });
    new CfnOutput(this, 'InstallationAccessTokenEndpoint', {
      value: installationAccessTokenUrl,
      exportName: 'InstallationAccessTokenEndpoint',
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new TheAppFrameworkTestStack(app, 'the-app-framework-test-stack', {
  env: devEnv,
});

app.synth();
