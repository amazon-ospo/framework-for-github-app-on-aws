# GitHub App Private Key Management Scripts

## Introduction

This tool is part of framework-for-github-app-on-aws (the app framework),
a solution developed by Amazon's Open Source Program Office (OSPO)
that simplifies and secures GitHub App management.
While GitHub Apps offer significant advantages
over Personal Access Tokens (PATs) and OAuth Apps,
they require secure handling of private keys and proper credential management.

GitHub Apps use public-key cryptography for authentication,
using private keys to sign JSON Web Tokens (JWTs) for API requests.
When creating a GitHub App,
GitHub generates an RSA key pair:

- GitHub retains the public key for verification
- The app owner receives the private key for JWT signing

GitHub generates private keys through their platform
as PEM (Privacy Enhanced Mail) files.
This tool securely imports these keys into AWS KMS
for enhanced security and management.

For more information about GitHub Apps, see:
[About GitHub Apps](https://docs.github.com/en/apps/overview#about-github-apps)

## Overview

This tool implements the app framework's Credential Management component
for secure import of GitHub App private keys into AWS KMS.
It handles the complete lifecycle of key management
including validation, encryption, import, and rotation.

This tool consists of two scripts that work together:

1. **`getTableName.ts`** - Lists available DynamoDB tables

1. **`importPrivateKey.ts`** - Securely imports GitHub App private keys
   into AWS KMS

The tool performs these key actions:

- Lists available DynamoDB tables for key storage

- Validates PEM file path, GitHub App ID, and target tableName

- Creates a new KMS key for JWT signing

- Encrypts and imports private key into KMS

- Stores KMS key ARN in DynamoDB

- Manages key rotation:

  - Supports importing new private keys
  - Tags old keys as Inactive

- Deletes the PEM file after successful import

Key advantages of using this tool as part of the app framework:

1. Eliminates exposure of private keys after secure import
1. Leverages AWS KMS HSMs for secure key storage
1. Automates secure key material wrapping and import
1. Simplifies key rotation and lifecycle management

---

## Prerequisites

### 1. Install Node.js

Node.js version **18 or higher** is recommended.

1. Visit [nodejs.org](https://nodejs.org/)
1. Download and install the recommended version
1. Verify installation:

```sh
node --version
```

### 2. Set Up AWS Credentials

The scripts require access to **AWS KMS and DynamoDB**.
Configure your AWS credentials using your preferred method described in the
[AWS Credentials Configuration Guide](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-configure.html).

---

## Generate and Prepare GitHub App Credentials

### Get the GitHub App ID

1. Go to GitHub App Settings

   - Open [GitHub Developer Settings](https://github.com/settings/apps)
   - Select "GitHub Apps"
   - Click on your GitHub application

1. Find your App ID
   - Located at the top of the settings page
   - It's a numeric value (e.g., `App ID: 123456`)

### Generate the Private Key (PEM File)

A private key is required to authenticate as your GitHub App.

1. In the same GitHub App settings page:

   - Scroll to "Private Keys" section
   - Click `Generate a private key`
   - A `.pem` file will automatically download

1. **Important**: Store this file securely
   - The same file cannot be downloaded again
   - If lost, you'll need to generate a new key
   - Keep track of the file location for the import process

**NOTE:** GitHub Apps are subject to a limit of 25 active private keys
per application

For more details, see:
[Managing private keys for GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps)

## Required AWS Permissions

Ensure AWS credentials have these required permissions:

### Resource Groups Tagging API Permissions

- `tag:GetResources` - Lists and filters tagged DynamoDB tables

### KMS Permissions

- `kms:CreateKey` - Creates new KMS keys
- `kms:DescribeKey` - Retrieves key metadata
- `kms:GetParametersForImport` - Obtains key import parameters
- `kms:ImportKeyMaterial` - Imports private key material
- `kms:Sign` - Sign JWT tokens for GitHub App authentication
- `kms:TagResource` - Tag keys with metadata and for tracking status

### DynamoDB Permissions

- `dynamodb:PutItem` - Stores KMS key ARN mappings
- `dynamodb:GetItem` - Retrieve existing key mappings for validation

## CLI Tool Installation for Ops-Tools Scripts

The app-framework CLI tool is built using Node.js and TypeScript. To use it:

1. Install the package dependencies:

```sh
npm install
```

1. The CLI tool will be available through:

- `app-framework` command
- `npm run cli`

### CLI Commands

The app-framework CLI provides two sub commands

1. `getTableName` - List the available DynamoDB tables
1. `importPrivateKey` - To import GitHub App private key into AWS KMS.

Running `npm run cli` without arguments displays
the available commands and options:

```sh
Usage: app-framework [options] [command]

CLI tool to get name of the App table with FrameworkForGitHubAppOnAwsManaged 
tag and to import GitHub App private key into AWS KMS

Options:
  -V, --version                                       output the version number
  -h, --help                                          display help for command

Commands:
  getTableName                                        Displays App tables with FrameworkForGitHubAppOnAwsManaged tag
  importPrivateKey <pemFilePath> <appId> <tableName>  Import GitHub App private key into AWS KMS
  help [command]                                      display help for command
```

### Step 1: List Available Tables

First, run the table listing command to identify your target DynamoDB table:

```sh
app-framework getTableName
```

Example Output:

```sh
Available tables:

1. GithubAppStack-GitHubAppNestedStack-AppTable-1A2B3C4D5E6FS

Total tables found: 1
```

### Step 2: Import the Private key

Use the downloaded pem file path, GitHub App ID and
the table name chosen
as the arguments to the `app-framework importPrivateKey` command.

```sh
app-framework importPrivateKey <path-to-private-key.pem> <GitHubAppId> <tableName>
```

Example Usage:

```sh
app-framework importPrivateKey ~/Downloads/private-key.pem 12345 GithubAppStack-GitHubAppNestedStack-AppTable-1A2B3C4D5E6FS
```

### Step 3: Cleanup Incomplete or Failed Imports

- If the import process fails or is interrupted,
  you need to clean up pending or failed keys to avoid incurring costs.

- This includes keys that were created but not fully imported,
  or keys that were imported but failed to update the DynamoDB table.

- These incomplete/failed keys will be tagged as Status: **Failed** in AWS KMS.

---

## Key Rotation

### Why Rotate Keys

Private key rotation is a crucial security practice for GitHub Apps.

Regular rotation helps mitigate the risk of key compromise
and limits the potential damage if a key is exposed.

### When to Rotate Keys

Regular rotation is not mandatory
since keys are securely stored and used within KMS,
but this tool supports rotation when needed for your specific requirements.

As a best practice, you can rotate your GitHub App's private key:

1. Immediately if you suspect the key has been compromised
1. After any security incident, even if unrelated

### Rotation Process

The app framework simplifies the key rotation process:

1. Generate a new private key in your GitHub App settings

1. Run the [import process steps](https://github.com/amazon-ospo/framework-for-github-app-on-aws/edit/main/README.md#running-scripts)

1. The tool automatically:
   - Creates a new KMS key
   - Securely imports the private key
   - Updates the DynamoDB table with the new key's information
   - Tags the old key as inactive in AWS KMS
   - Permanently deletes the newly downloaded PEM file

This process ensures a smooth transition
while maintaining security and preventing disruption to your app's operations.

### Post-Rotation Manual Clean-up Steps

<!-- TODO: We should think about building monitoring capabilities
into the credential manager to help users determine
when all running logic has transitioned to using the new key -->

**Important:** Ensure all your GitHub App processes are functioning correctly
with the new key before removing the old keys.

After confirming that all your processes are successfully using the new key:

1. Remove the old private key:

   - Go to your GitHub App settings page
   - Navigate to the "Private Keys" section
   - Locate and delete the old private key

   **NOTE:** Once deleted, these keys immediately become invalid

1. Schedule the old KMS key for deletion:
   - Go to AWS KMS console
   - Locate the tagged Inactive key
   - Schedule it for deletion with a waiting period between 7 and 30 days

## FAQs

1. Missing GitHub App ID?

   - Go to GitHub App Settings
   - Find your App ID at the top of you app's page

1. Lost Private Key?

   - If you lost the `.pem` file, you need to generate a
     new one in the GitHub App settings and perform the import process again.

   - Each key remains valid until explicitly deleted from
     GitHub App settings.

1. Need more information?

- [GitHub Apps documentation](https://docs.github.com/en/apps)
- [Best practices for creating a GitHub App](https://docs.github.com/en/apps/creating-github-apps/setting-up-a-github-app/best-practices-for-creating-a-github-app#securing-your-github-app)
- [GitHub App authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-github-apps)
- [AWS KMS documentation](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html)
