import { RemovalPolicy, NestedStack, Tags } from 'aws-cdk-lib';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, IGrantable, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { InstallationAcessTokenGenerator } from './get-installation-access-token';
export interface CredentialManagerProps {}

/**
 * Nested stack for storing GitHub App installation targets and pre-approved lists.
 */
export class CredentialManager extends NestedStack {
  readonly appTable: Table;
  readonly installationAccessTokenEndpoint: string;
  readonly installationAccessLambdaArn: string;
  readonly installationTable: Table;
  constructor(scope: Construct, id: string, props?: CredentialManagerProps) {
    super(scope, id, props);
    Tags.of(this).add('FrameworkForGitHubAppOnAwsManaged', 'CredentialManager');
    // Table for storing GitHub App IDs and their corresponding private key ARNs that stored in AWS KMS.
    this.appTable = new Table(this, 'AppTable', {
      partitionKey: {
        name: 'AppId',
        type: AttributeType.NUMBER,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });
    Tags.of(this.appTable).add('CredentialManager', 'AppTable');
    // Table for tracking GitHub App installations.
    // Stores `node_id`, `installation_id`, `app_id`
    // and last updated timestamp.
    this.installationTable = new Table(this, 'AppInstallationTable', {
      partitionKey: {
        name: 'AppId',
        type: AttributeType.NUMBER,
      },
      sortKey: {
        name: 'NodeId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });
    Tags.of(this.installationTable).add(
      'CredentialManager',
      'AppInstallationTable',
    );
    // Global secondary index for looking up installations by Node ID.
    this.installationTable.addGlobalSecondaryIndex({
      indexName: 'NodeID',
      partitionKey: {
        name: 'NodeId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'AppId',
        type: AttributeType.NUMBER,
      },
    });
    // Global secondary index for looking up installations by installations ID.
    this.installationTable.addGlobalSecondaryIndex({
      indexName: 'InstallationID',
      partitionKey: {
        name: 'InstallationId',
        type: AttributeType.NUMBER,
      },
      sortKey: {
        name: 'AppId',
        type: AttributeType.NUMBER,
      },
    });

    const getInstallationAccessTokenEndpoint =
      new InstallationAcessTokenGenerator(
        this,
        'InstallationAccessTokenGenerator',
        {
          AppTable: this.appTable,
          InstallationTable: this.installationTable,
        },
      );
    this.installationAccessLambdaArn =
      getInstallationAccessTokenEndpoint.lambdaHandler.functionArn;
    this.installationAccessTokenEndpoint =
      getInstallationAccessTokenEndpoint.functionUrl.url;
  }

  grantGetInstallationAccessToken(grantee: IGrantable) {
    grantee.grantPrincipal.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeFunctionUrl'],
        effect: Effect.ALLOW,
        resources: [this.installationAccessLambdaArn],
        conditions: {
          StringEquals: {
            'lambda:FunctionUrlAuthType': 'AWS_IAM',
          },
        },
      }),
    );
  }
}
