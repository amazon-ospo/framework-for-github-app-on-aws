# Acceptance Tests for Importing Private Key into AWS KMS

This document describes running acceptance tests
for importing GitHub App's private key into AWS KMS,
performing end-to-end testing against real AWS and GitHub resources.

## Overview

This test suite validates the complete workflow
of importing a private key into AWS KMS
and using it for JWT signing.

**IMPORTANT:** These tests interact with live AWS services and will:

- Create AWS resources (which incur costs)

- Each execution of tests creates 2 KMS keys

- Each subsequent execution keeps on adding 2 more KMS keys while
  keeping old ones in pending deletion state for a window of 30 days.

- Store data in DynamoDB table

- Make calls to GitHub's API

- Perform cryptographic operations

- Delete the PEM file after successful import

**Note:** Monitor your AWS costs carefully as multiple test runs will
accumulate KMS keys.

## Prerequisites

1. Install a GitHub App and download the private key which is a file in PEM
   format.

1. Keep a track of the file location for the import process

## Required AWS Permissions

Ensure AWS credentials have these required permissions:

### **KMS Permissions (Required for Key Management)**

- `kms:CreateKey` - Create new KMS keys
- `kms:DescribeKey` - Get key metadata and status
- `kms:GetParametersForImport` - Get import parameters for key material
- `kms:ImportKeyMaterial` - Import external key material into KMS
- `kms:ListResourceTags` - List tags associated with KMS keys
- `kms:ScheduleKeyDeletion` - Schedule deletion of old keys
- `kms:TagResource` - Tag keys for tracking status and metadata

### **DynamoDB Permissions (Required for Table Operations)**

- `dynamodb:PutItem` - Store KMS key ARNs in DynamoDB
- `dynamodb:GetItem` - Retrieve KMS key ARNs from DynamoDB
- `dynamodb:ListTables` - List available tables for validation

## Running Tests

1. List available DynamoDB tables:

```sh
   npm run get-table-name
```

1. Set up PEM file path, GitHub App ID,
   and Table name as environment variables to pass the tests

For `DYNAMODB_TABLE_NAME`, select an appropriate table name from `npm run get-table-name`.

```sh
export GITHUB_PEM_FILE_PATH=<path-to-your-private-key.pem>
export GITHUB_APPID=<your-github-app-id>
export DYNAMODB_TABLE_NAME=<your-dynamo-table-name> # Use the table name you picked from step 1
```

1. Execute acceptance tests:

```sh
    npm run accept
```

**Note:** On first run, if the importPrivateKey.ts acceptance tests fail,
recheck if the environment variables are set correctly.

## After Successful test completion

- Old KMS keys are automatically scheduled for deletion

- The PEM file will be automatically deleted from the downloaded location for
  security.

- The most recently created KMS key remains active - you can manually delete
  it if you want to avoid ongoing costs.
