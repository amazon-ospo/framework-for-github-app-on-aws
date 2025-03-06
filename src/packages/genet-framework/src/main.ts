import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CredentialManager } from './credential-manager';
import { InstallationManager } from './installation-manager';

// CDK App entry for Genet acceptance test.
export class Genet extends Stack {
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

new Genet(app, 'genet-framework', { env: devEnv });

app.synth();