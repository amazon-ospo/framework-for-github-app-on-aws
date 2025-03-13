import { RemovalPolicy, NestedStack, Tags } from 'aws-cdk-lib';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface CredentialManagerProps {}

/**
 * Nested stack for storing GitHub App installation targets and pre-approved lists.
 */
export class CredentialManager extends NestedStack {
  readonly appTable: Table;
  constructor(scope: Construct, id: string, props?: CredentialManagerProps) {
    super(scope, id, props);
    Tags.of(this).add('GenetComponent', 'CredentialManager');
    // Table for storing GitHub App IDs and their corresponding private key ARNs that stored in AWS KMS.
    this.appTable = new Table(this, 'AppTable', {
      partitionKey: {
        name: 'AppId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });
    Tags.of(this.appTable).add('CredentialManager', 'AppTable');
  }
}
