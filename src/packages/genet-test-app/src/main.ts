import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CredentialManager, InstallationManager } from 'genet-framework';

// CDK App entry for Genet acceptance test.
// This stack is intended for testing genet-framework library.
// In a real use case, it should be a stack defined by customer.
export class GenetFrameworkTestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    new CredentialManager(this, 'CredentialManager', {});
    new InstallationManager(this, 'InstallationManager', {});
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new GenetFrameworkTestStack(app, 'genet-framework-test-stack', { env: devEnv });

app.synth();
