import { NestedStack } from 'aws-cdk-lib';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface InstallationManagerProps {}
/**
 * Nested stack for managing GitHub App installation targets and pre-approved lists.
 */
export class InstallationManager extends NestedStack {
  readonly targetTable: Table;
  readonly installationTable: Table;
  constructor(scope: Construct, id: string, props: InstallationManagerProps) {
    super(scope, id, props);
    // Table for storing the pre-approval target list GitHub App installation.
    this.targetTable = new Table(this, 'PreApprovalTargetTable', {
      partitionKey: {
        name: 'AppId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });
    // Global secondary index to query targets by Node ID.
    this.targetTable.addGlobalSecondaryIndex({
      indexName: 'NodeID',
      partitionKey: {
        name: 'NodeId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'AppId',
        type: AttributeType.STRING,
      },
    });
    // Table for tracking GitHub App installations.
    // Stores `node_id`, `installation_id`, `app_id`
    // and last updated timestamp.
    this.installationTable = new Table(this, 'AppInstallationTable', {
      partitionKey: {
        name: 'AppId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });
    // Global secondary index for looking up installations by Node ID.
    this.installationTable.addGlobalSecondaryIndex({
      indexName: 'NodeID',
      partitionKey: {
        name: 'NodeId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'AppId',
        type: AttributeType.STRING,
      },
    });
    // Global secondary index for looking up installations by installations ID.
    this.installationTable.addGlobalSecondaryIndex({
      indexName: 'InstallationID',
      partitionKey: {
        name: 'InstallationId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'AppId',
        type: AttributeType.STRING,
      },
    });
  }
}
