import { NestedStack, Tags } from 'aws-cdk-lib';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface InstallationManagerProps {}
/**
 * Nested stack for managing GitHub App installation targets and pre-approved lists.
 */
export class InstallationManager extends NestedStack {
  readonly targetTable: Table;
  constructor(scope: Construct, id: string, props: InstallationManagerProps) {
    super(scope, id, props);
    Tags.of(this).add(
      'FrameworkForGitHubAppOnAwsManaged',
      'InstallationManager',
    );
    // Table for storing the pre-approval target list GitHub App installation.
    this.targetTable = new Table(this, 'PreApprovalTargetTable', {
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
    Tags.of(this.targetTable).add('InstallationManager', 'PreApprovalTable');
    // Global secondary index to query targets by Node ID.
    this.targetTable.addGlobalSecondaryIndex({
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
  }
}
