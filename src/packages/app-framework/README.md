# Credential Manager

Credential Manager is part of the
[framework-for-github-app-on-aws](https://github.com/amazon-ospo/framework-for-github-app-on-aws)
(The framework).
It provides a secure and scalable solution for
managing GitHub App credentials on AWS,
with minimal custom code.

## Overview

The Genet Credential Manager is a nested CDK stack and Level 3 (L3) construct
that helps you manage GitHub App credentials on AWS.
It securely stores your app's private key,
creates short-lived App Tokens using AWS KMS,
and retrieves Installation Access Tokens.
This removes the need to write custom authentication logic
or directly manage sensitive keys.
The component integrates with your CDK application
and exposes well-defined APIs and permission grants
for secure credential access.
By placing this functionality behind a dedicated API,
you not only simplify implementation but also gain an
additional layer of fine-grained access control via IAM policies

The Credential Manager simplifies and secures
GitHub App credential handling by providing:

- **Secure storage** of GitHub App private signing keys using AWS KMS
- **APIs** for generating GitHub App and Installation Access Tokens
- **Minimal logic required** in your business application

## Why Credential Manager?

GitHub Apps require a long-lived App Signing Key,
which is used to generate short-lived App Tokens.
These App Tokens are then used to request Installation Access Tokens
that authorize API access to GitHub resources.
While this flow is secure and scalable by design,
it introduces operational and security risks.
App Signing Keys are sensitive, and if stored improperly,
they are vulnerable to accidental leaks or misuse.
Because these keys can be used to generate unlimited App Tokens,
any compromise could grant unauthorized access
across all installations of the App.

The Credential Manager addresses these challenges
by storing the signing key securely in
AWS KMS-managed Hardware Security Modules (HSMs).
It uses KMS signing to generate JWT-based App Tokens,
so the key never leaves the secure boundary.
The system exposes IAM-authenticated Lambda Function URLs
that allow trusted components to retrieve App and Installation Access Tokens
without handling or accessing the key directly.
This design eliminates the need to embed key logic in your business code,
reduces the attack surface,
and enforces least privilege through fine-grained IAM controls.

## Usage

### Prerequisite

Before using Credential Manager in your application,
you must complete the following setup steps:

1. **Deploy the Credential Manager CDK stack**
   This provisions all required infrastructure
   including DynamoDB tables, Lambda functions.

1. **Import your GitHub App's private key into AWS KMS**
   Use the [app-framework-ops-tool](../../packages/app-framework-ops-tools)
   to securely import your GitHub App private key into KMS.

See the [README.md](../../packages/app-framework-ops-tools/README.md)
for step-by-step instructions on importing your GitHub App key.

### Stack Integration

To use the Credential Manager in your CDK application,
simply add the `CredentialManager` L3 construct to your stack.
This provision all the necessary infrastructure,
including DynamoDB tables, Lambda functions, and KMS keys.
Use the provided methods to allow your Lambda functions
or other IAM principals to generate tokens.
These tokens are obtained by invoking the generated Function URLs
using Smithy clients in your business logic.

```text
import { CredentialManager } from '@aws/app-framework-for-github-apps-on-aws';

class MyStack extends Stack {
    constructor(scope: App, id: string) {
        super(scope, id);
        // Some component of your infrastructure that needs to get GitHub credentials.
        const examplePrincipal: IGrantable = someLambdaFunction;

        // Create the credential manager
        const credManager = new CredentialManager(this, 'CredentialManager', {});

        // You retrieve endpoints from credentialManager properties to pass into your Smithy client in your business logic.
        const appTokenEndpoint: string = credentialManager.appTokenEndpoint;
        const installationAccessTokenEndpoint: string = credentialManager.installationAccessTokenEndpoint;

        // Grant token generation permissions to other resources
        credManager.grantGetAppToken(examplePrincipal);
        credManager.grantGetInstallationAccessToken(examplePrincipal);
    }
}
```

### Available Methods

#### grantGetAppToken

Grants permission to invoke the App token generation endpoint:

```text
grantGetAppToken(grantee: IGrantable): void
```

#### grantGetInstallationAccessToken

Grants permission to invoke the installation access token endpoint:

```text
grantGetInstallationAccessToken(grantee: IGrantable): void
```

#### grantRefreshCachedData

Grants permission to invoke the refresh cached data endpoint:

```text
grantRefreshCachedData(grantee: IGrantable): void
```

#### grantGetInstallationRecord

Grants permission to invoke the installation record retrieval endpoint:

```text
grantGetInstallationRecord(grantee: IGrantable): void
```

#### rateLimitDashboard

Creates a Cloudwatch dashboard with two widgets consisting of an alarm
which goes below a default value of 20% of the total rate limit
for any GitHub App it will go in an alarm state and there is a widget
which shows all the rate limit percent remaining for each GitHub App:

```text
rateLimitDashboard({ limit?: number }): void
```

### Smithy Client

To interact with Credential Manager’s APIs,
use the framework generated Smithy client.
This client handles AWS SigV4 signing and request construction
for both App Token and Installation Access Token APIs.

#### Initialize Client

```text
import { AppFrameworkClient } from '@aws/app-framework-for-github-apps-on-aws-client';

const client = new AppFrameworkClient({
  endpoint: '<your deployed Lambda Function URL>',
  region: '<your AWS region>',
  credentials: '<your AWS credential provider>', 
  sha256: Sha256, // Sha256 hsing algorithm
});
```

#### Example: Get Installation Access Token

```text
import { GetInstallationTokenCommand } from '@aws/app-framework-for-github-apps-on-aws-client';

const command = new GetInstallationTokenCommand({
  appId: '<your App ID>',
  nodeId: '<your App installation target node_id>',
});

const response = await client.send(command);
const token = response.installationToken;
```

#### Example: Get App Token

```text
import { GetAppTokenCommand } from '@aws/app-framework-for-github-apps-on-aws-client';

const command = new GetAppTokenCommand({
  appId: '<your App ID>',
});

const response = await client.send(command);
const token = response.appToken;
```

#### Example: Refresh Cached Data

```text
import { RefreshCachedDataCommand } from '@aws/app-framework-for-github-apps-on-aws-client';

const command = new RefreshCachedDataCommand({});

const response = await client.send(command);
```

#### Example: Get Installation Data

```text
import { GetInstallationDataCommand } from '@aws/app-framework-for-github-apps-on-aws-client';

const command = new GetInstallationDataCommand({
  nodeId: '<your target node_id>',
});

const response = await client.send(command);
const installations = response.installations;
```

## What Resources Are Created by Credential Manager

### DynamoDB Tables

#### App Table

Stores GitHub App IDs and their corresponding private key ARNs

- Schema:

  - Partition Key: `AppId` (NUMBER)

- Configuration:
  - Billing Mode: PAY_PER_REQUEST
  - Point-in-Time Recovery: Enabled
  - Removal Policy: RETAIN

#### Installation Table

Tracks GitHub App installations with node_id, installation_id, and app_id

- Schema:

  - Partition Key: `AppId` (NUMBER)
  - Sort Key: `NodeId` (STRING)

- Global Secondary Indexes:

  - `NodeID`:

    - Partition Key: `NodeId` (STRING)
    - Sort Key: `AppId` (NUMBER)

  - `InstallationID`:
    - Partition Key: `InstallationId` (NUMBER)
    - Sort Key: `AppId` (NUMBER)

- Configuration:
  - Billing Mode: PAY_PER_REQUEST
  - Point-in-Time Recovery: Enabled

### Lambda Functions

#### GitHub App Token Generator

The App Token Generator is a Lambda function
that generates short-lived JWTs used to authenticate the GitHub App itself.
It exposes a Function URL with AWS IAM authentication
and performs RSA signing operations through KMS.
Access is restricted to IAM principals explicitly granted through `grantGetAppToken`.

- Permissions:
  - KMS:Sign for GitHub App private keys
  - DynamoDB Read access to App table

#### Installation Access Token Generator

The Installation Access Token Generator is a Lambda function
that retrieves GitHub Installation Access Tokens
for a specific installation of your GitHub App.
It is exposed through a Function URL with IAM authentication,
and access is controlled via `grantGetInstallationAccessToken`.

- Permissions:
  - KMS:Sign for GitHub App private keys
  - DynamoDB Read access to both tables

#### Refresh Cached Data

The Refresh Cached Data Lambda function
synchronizes installation data between GitHub and DynamoDB.
While the AppInstallation Table is automatically updated
by the installation tracker every 30 minutes,
this API gives you the ability to refresh cached data at any time on-demand.
It retrieves all App IDs from the App Table,
fetches current installations from GitHub,
and updates the Installation Table with refreshed timestamps.
It is exposed through a Function URL with IAM authentication,
and access is controlled via `grantRefreshCachedData`.

- Permissions:
  - KMS:Sign for GitHub App private keys
  - DynamoDB Read/Write access to both tables

#### Get Installation Data

The Get Installation Data Lambda function
retrieves cached installation data from DynamoDB for a given nodeId.
It provides access to installation records without requiring GitHub API calls.
It is exposed through a Function URL with IAM authentication,
and access is controlled via `grantGetInstallationRecord`.

- Permissions:
  - DynamoDB Read access to Installation table

### Scheduler

#### GitHub App Sync Scheduler

Scans the GitHub App installation metadata every 30 minutes
and updates the Installation Table.
This ensures the table stays in sync with active installations
and can be used to track installation lifecycles reliably.

### Rate Limit Scheduler

Scans GitHub App Rate Limit usages every 5 minutes and generates metrics
using AWS Powertools. These metrics can be seen from the rate limit dashboard.
This enables proper tracking of rate limit usage for each GitHub App.

## Security Considerations

### Data Protection

Credential Manager stores your
GitHub App signing key using AWS KMS.
All signing operations are delegated to KMS,
ensuring that the private key never leaves KMS-managed HSMs.

[AWS KMS does not maintain the durability of imported key materials
at the same level as key material that AWS KMS generates.](https://docs.aws.amazon.com/kms/latest/developerguide/import-keys-protect.html)
In the unlikely event of certain region-wide failures that affect AWS KMS,
your imported key material may need to be re-imported into a new KMS key.
However, the impact in this use case should be low,
because you can simply go to your GitHub App settings
and generate a new private key,
then re-import the new key into KMS to resume operation.

Metadata is stored in DynamoDB with Point-in-Time Recovery enabled,
and the App table uses a `RETAIN` removal policy
to prevent accidental data loss.

### Access Control

Function URLs require AWS IAM authentication,
and only explicitly granted IAM principals can invoke them.
Access to KMS keys is restricted via tag-based policies
to enforce fine-grained permissions.

## Cost Impact

These AWS resources incur usage-based charges:

1. **DynamoDB**

   - Pay-per-request billing for both tables
   - Point-in-Time Recovery costs
   - Storage costs for table data

1. **Lambda**

   - Function invocation charges
   - Memory usage
   - Function URL requests

1. **KMS**
   - Key storage fees
   - Signing operation charges

**Important Note**:

1. The App table's RETAIN removal policy means it will persist
   even if the stack is deleted,
   potentially leading to ongoing costs.

1. When you rotate App signing key,
   we do not automatically schedule the old key for deletion.
   You will need to schedule the old key for deletion.
   Failure to do so can result in ongoing KMS storage charges for unused keys.

## Resource Identification

The Credential Manager uses AWS resource tags for resource identification
and access control instead of relying on static resource names.
This approach provides better flexibility and control over resource management.

### Resources Tags

| Resource           | Tag Key                             | Tag Value                         |
| ------------------ | ----------------------------------- | --------------------------------- |
| Stack              | `FrameworkForGitHubAppOnAwsManaged` | `CredentialManager`               |
| App Table          | `CredentialManager`                 | `AppTable`                        |
| Installation Table | `CredentialManager`                 | `AppInstallationTable`            |
| Function URLs      | `CredentialManager`                 | `AppTokenEndpoint`                |
|                    |                                     | `InstallationAccessTokenEndpoint` |
|                    |                                     | `RefreshCachedDataEndpoint`       |
|                    |                                     | `InstallationCachedDataEndpoint`  |

### Tag-Based Access Control

The framework uses tags for controlling access to KMS keys.
KMS signing permissions are restricted to keys with specific tags:

```text
    StringEquals: {
      'aws:ResourceTag/FrameworkForGitHubAppOnAwsManaged': 'true',
      'aws:ResourceTag/Status': 'Active'
    }
```
