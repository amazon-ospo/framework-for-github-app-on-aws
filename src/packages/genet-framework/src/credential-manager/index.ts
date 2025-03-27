import { RemovalPolicy, NestedStack, Tags } from 'aws-cdk-lib';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface CredentialManagerProps {}

/**
 * Nested stack for storing GitHub App installation targets and pre-approved lists.
 */
export class CredentialManager extends NestedStack {
  readonly appTable: Table;
  readonly installationTable: Table;
  constructor(scope: Construct, id: string, props?: CredentialManagerProps) {
    super(scope, id, props);
    Tags.of(this).add('GenetComponent', 'CredentialManager');
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
  }
}
