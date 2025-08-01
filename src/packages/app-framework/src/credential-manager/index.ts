import { RemovalPolicy, NestedStack, Tags, Duration } from 'aws-cdk-lib';
import {
  Alarm,
  AlarmWidget,
  ComparisonOperator,
  Dashboard,
  GraphWidget,
  GraphWidgetView,
  HorizontalAnnotation,
  MathExpression,
  Shading,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, IGrantable, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SERVICE_NAME } from './constants';
import { GitHubAppToken } from './get-app-token/appToken';
import { InstallationAcessTokenGenerator } from './get-installation-access-token';
import { InstallationCachedData } from './get-installation-data';
import { InstallationTracker } from './installation-tracker';
import { RateLimitTracker } from './rate-limit-tracker';
import {
  GITHUB_API_CALLS_REMAINING_PERCENT,
  METRIC_NAMESPACE,
  NEARING_RATELIMIT_THRESHOLD_ERROR,
} from './rate-limit-tracker/constants';
import { InstallationRefresher } from './refresh';

export interface CredentialManagerProps {}

export interface RateLimitDashboardProps {
  ({ limit }: { limit?: number }): void;
}

/**
 * Nested stack for storing GitHub App installation targets and pre-approved lists.
 */
export class CredentialManager extends NestedStack {
  readonly appTable: Table;
  readonly appTokenEndpoint: string;
  readonly appTokenLambdaArn: string;
  readonly installationAccessTokenEndpoint: string;
  readonly installationAccessLambdaArn: string;
  readonly installationTable: Table;
  readonly refreshCachedDataEndpoint: string;
  readonly refreshCachedDataLambdaArn: string;
  readonly installationRecordLambdaArn: string;
  readonly installationRecordEndpoint: string;

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

    // GitHubAppToken construct, which creates a lambda function with a Function URL.
    const getAppTokenEndpoint = new GitHubAppToken(this, 'AppTokenGenerator', {
      appTableName: this.appTable.tableName,
      installationTableName: this.installationTable.tableName,
    });
    // Grant lambda function read access to the App table.
    this.appTable.grantReadData(getAppTokenEndpoint.lambdaHandler);
    this.appTokenEndpoint = getAppTokenEndpoint.functionUrl.url;
    this.appTokenLambdaArn = getAppTokenEndpoint.lambdaHandler.functionArn;
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

    // Creates a construct to track GitHub App installations and handle installation events
    new InstallationTracker(this, 'InstallationTracker', {
      AppTable: this.appTable,
      InstallationTable: this.installationTable,
    });
    // Creates a construct to monitor and track GitHub API rate limits
    new RateLimitTracker(this, 'RateLimitTracker', {
      AppTable: this.appTable,
      InstallationTable: this.installationTable,
    });
    // Creates a construct to refresh cached installation data
    const refreshCache = new InstallationRefresher(
      this,
      'InstallationRefresher',
      {
        AppTable: this.appTable,
        InstallationTable: this.installationTable,
      },
    );
    // Grant the refresh cache lambda read access to the app table
    this.appTable.grantReadData(refreshCache.lambdaHandler);
    this.installationTable.grantReadWriteData(refreshCache.lambdaHandler);
    this.refreshCachedDataEndpoint = refreshCache.functionUrl.url;
    this.refreshCachedDataLambdaArn = refreshCache.lambdaHandler.functionArn;
    // Creates a construct to provide cached installation data
    const installationData = new InstallationCachedData(
      this,
      'InstallationData',
      {
        InstallationTable: this.installationTable,
      },
    );
    this.installationRecordLambdaArn =
      installationData.lambdaHandler.functionArn;
    this.installationRecordEndpoint = installationData.functionUrl.url;
  }

  // Grants a caller permission to invoke the app token lambda Function URL.
  grantGetAppToken(grantee: IGrantable) {
    grantee.grantPrincipal.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeFunctionUrl'],
        effect: Effect.ALLOW,
        resources: [this.appTokenLambdaArn],
        conditions: {
          StringEquals: {
            'lambda:FunctionUrlAuthType': 'AWS_IAM',
          },
        },
      }),
    );
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

  grantRefreshCachedData(grantee: IGrantable) {
    grantee.grantPrincipal.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeFunctionUrl'],
        effect: Effect.ALLOW,
        resources: [this.refreshCachedDataLambdaArn],
        conditions: {
          StringEquals: {
            'lambda:FunctionUrlAuthType': 'AWS_IAM',
          },
        },
      }),
    );
  }

  grantGetInstallationRecord(grantee: IGrantable) {
    grantee.grantPrincipal.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeFunctionUrl'],
        effect: Effect.ALLOW,
        resources: [this.installationRecordLambdaArn],
        conditions: {
          StringEquals: {
            'lambda:FunctionUrlAuthType': 'AWS_IAM',
          },
        },
      }),
    );
  }

  /**
   * Dashboard to help track rate limits pf GitHub App API calls
   * @param limit is the rate limit percent the dashboard will alarm on
   */
  rateLimitDashboard: RateLimitDashboardProps = ({ limit = 20 }) => {
    const dashboard = new Dashboard(this, 'GitHubRateLimitTrackingDashboard', {
      dashboardName: 'GitHubRateLimitTrackingDashboard',
    });

    const horizontalAnnotation: HorizontalAnnotation = {
      value: limit,
      fill: Shading.NONE,
      visible: true,
    };

    const alarmWidget = new AlarmWidget({
      alarm: new Alarm(this, 'NearingRateLimitAlarm', {
        alarmName: `${METRIC_NAMESPACE}${NEARING_RATELIMIT_THRESHOLD_ERROR}`,
        alarmDescription:
          'Alarm triggers if any GitHub calls are approaching rate limit',
        metric: new MathExpression({
          expression: `SELECT MIN(${GITHUB_API_CALLS_REMAINING_PERCENT}) FROM "${METRIC_NAMESPACE}" WHERE service = '${SERVICE_NAME}'`,
          label: 'Minimum API Calls Remaining (%)',
          period: Duration.minutes(5),
        }),
        evaluationPeriods: 1,
        threshold: limit,
        comparisonOperator: ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      }),
      title: 'Nearing RateLimit Alarm',
      width: 12,
      height: 8,
    });

    const widget = new GraphWidget({
      title: 'GitHub API Calls Remaining (%)',
      width: 12,
      height: 8,
      view: GraphWidgetView.TIME_SERIES,
      period: Duration.minutes(5),
      stacked: false,
      left: [
        new MathExpression({
          expression: `SEARCH('{${METRIC_NAMESPACE},Category,AppID,InstallationID,service} MetricName="${GITHUB_API_CALLS_REMAINING_PERCENT}"', 'Average')`,
          label: 'APICallsRemaining',
          period: Duration.minutes(5),
        }),
      ],
      leftAnnotations: [horizontalAnnotation],
      leftYAxis: {
        min: 0,
        max: 100,
        label: 'Percent',
      },
    });

    dashboard.addWidgets(alarmWidget, widget);
  };
}
