# Import GitHub App's Private Key into AWS KMS

## Overview

A secure tool for importing GitHub App private keys into AWS KMS
for enhanced security and management.
It handles the complete lifecycle of key management
including validation, encryption, import, and rotation.

This tool consists of two scripts that work together:

1. A table listing script(`getTable.ts`) that shows available DynamoDB tables.

1. A key import script (`import-private-key`) that securely imports a
   **GitHub App private key** into **AWS KMS**,
   allowing the GitHub App to sign authentication tokens securely.

The tool performs the following actions:

- Lists available DynamoDB tables for key storage
- Validates the private key and GitHub App ID
- Creates a new KMS key for signing GitHub tokens
- Encrypts the private key and imports it into KMS
- Stores the KMS key ARN in the selected DynamoDB table
- Deletes any old KMS keys that were previously used.
- Manages key rotation by safely handling old keys

---

## Prerequisites

### 1. Install Node.js and npm

Node.js version **16 or higher** is recommended.

1. Visit [nodejs.org](https://nodejs.org/)
1. Download and install the recom mended version
1. Verify installation :

```sh

node --version

```

```sh

npm --version
```

### 2. Set Up AWS Credentials

The scripts need access to **AWS KMS and DynamoDB**.
Configure your AWS credentials using your preferred method as described in the
[AWS SDK for JavaScript Configuration Guide](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-configure.html).

---

## Generate and Prepare GitHub App Credentials

### Get the GitHub App ID

1. Go to your GitHub App Settings

   - Open [GitHub Developer Settings](https://github.com/settings/apps)
   - Select "GitHub Apps"
   - Click on your application

1. Find your App ID
   - Located at the top of the settings page
   - It's a numeric value (e.g., `App ID: 123456`)

### Generate the Private Key (PEM File)

A private key is required to authenticate your GitHub App.

1. In the same GitHub App settings page:

   - Scroll to "Private Keys" section
   - Click `Generate a private key`
   - A `.pem` file will automatically download

1. **Important**: Store this file securely
   - The same file cannot be downloaded again
   - If lost, you'll need to generate a new key
   - Keep track of the file location for the import process

## Running Scripts

### Step 1: List Available Tables

First, run the table listing script to identify your target DynamoDB table:

```sh
npm run get-table-name
```

Example Output:

```sh

Available tables:

1. GithubAppStack-GitHubAppNestedStack-PrivateKeysTable-1A2B3C4D5E6FS
1. GithubAppStack-GitHubAppNestedStack-SomeOtherTable-7G8H9I0J1K2L

Total tables found: 2

```

### Step 2: Import the Private key

Use the downloaded pem file path, GitHub App ID and
the table name chosen from Step 1
as the arguments to the import script.

```sh

npm run import-private-key <path-to-private-key.pem> <GitHubAppId> <tableName>
```

Example Usage:

```sh

npm run import-private-key /Users/${user}/Downloads/private-key.pem 12345 GithubAppStack-GitHubAppNestedStack-PrivateKeysTable-1A2B3C4D5E6FS
```

---

### Resource Groups Tagging API Permissions

- `tag:GetResources` - For listing tagged DynamoDB tables

### **KMS Permissions (Required for Key Management)**

- `kms:CreateKey`
- `kms:DescribeKey`
- `kms:GetParametersForImport`
- `kms:ImportKeyMaterial`
- `kms:Sign`
- `kms:ScheduleKeyDeletion`
- `kms:TagResource`

### **DynamoDB Permissions (Required for Storing Key ARN)**

- `dynamodb:PutItem`
- `dynamodb:GetItem`

## FAQs

1. Missing GitHub App ID?

   - Go to GitHub App Settings
   - Find your App ID at the top of you app's page

1. Lost Private Key?

   - If you lost the .pem file, you need to generate a
     new one in the GitHub App settings.

   - Generating a new key will invalidate any previously
     generated keys.
