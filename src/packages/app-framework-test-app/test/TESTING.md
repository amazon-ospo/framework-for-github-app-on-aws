# Acceptance Tests for Retrieving GitHub Tokens

This document describes how to run acceptance tests
for retrieving GitHub App token and Installation access token
using the deployed Credential Manager infrastructure
and a private key imported into AWS KMS.
These tests perform end-to-end validation using real AWS and GitHub resources.

## Overview

This test suite validates:

- Retrieval of a GitHub App token and Installation access token
  using the deployed Lambda API endpoints.

- Expected behavior for valid and invalid GitHub App IDs.

- Integration across the Framework generated Smithy client,
  AWS KMS, DynamoDB, and Lambda.

## Required AWS Permissions

Ensure AWS credentials have these additional required permissions:

### **KMS Permissions (Required for Key Management)**

- `kms:CreateKey` - Create new KMS keys
- `kms:DescribeKey` - Get key metadata and status
- `kms:GetParametersForImport` - Get import parameters for key material
- `kms:ImportKeyMaterial` - Import external key material into KMS
- `kms:ListResourceTags` - List tags associated with KMS keys
- `kms:TagResource` - Tag keys for tracking status and metadata
- `kms:Sign` - Generate digital signatures using asymmetric KMS keys

### **DynamoDB Permissions (Required for Table Operations)**

- `dynamodb:PutItem` - Store KMS key ARNs in DynamoDB
- `dynamodb:GetItem` - Retrieve KMS key ARNs from DynamoDB
- `dynamodb:ListTables` - List available tables for validation

### **Lambda Permission (Required for invoke Lambda function)**

- `lambda:InvokeFunctionUrl` - Invoke Lambda function URL

## Prerequisites

### 1. Follow Common Setup

Refer to the top level [TESTING.md](../../../../test/TESTING.md)
to set up common prerequisites.

After that, deploy the Credential Manager infrastructure
and store the output in `cdk-output.json` file:

```sh
  npx projen deploy --outputs-file ./cdk-output.json
```

Make sure the `cdk-output.json` file
is present at `app-framework-test-app` package
and includes a valid AppTokenEndpoint value and
a valid InstallationAccessTokenEndpoint value.
The generated `cdk-output.json` file should include:

```sh
    {
      "the-app-framework-test-stack": {
        "AppTokenEndpoint": <your-lambda-function-url-for-app-token>,
        "InstallationAccessTokenEndpoint": <your-lambda-function-url-for-installation-token>,
        "Region": <your-aws-account-region>
      }
    }
```

### 2. Import the PEM file into AWS KMS

These acceptance tests running against real App private Key stored in AWS KMS.
Please follow [README.md](../../../packages/app-framework-ops-tools/README.md)
in the `app-framework-ops-tools` package to import your
app private key to AWS KMS.

### 3. Set Required Environment Variables

Before running the tests, set the required environment variable:

```sh
    export GITHUB_APPID=<your-github-app-id>
    export GITHUB_NODEID=<your-github-node-id>
```

## Running Tests

Execute acceptance tests:

```sh
    npm run accept
```

## After Successful test completion

- The PEM file will be automatically deleted from the downloaded location for
  security.

- To clean up test resources and avoid ongoing costs:
  1. Go to your GitHub App settings and delete the generated private keys

  1. Go to AWS KMS console and schedule the KMS keys for deletion with
     a waiting period between 7 and 30 days

  1. Go to AWS console to delete test and nested stack,
     clean the resources created during the acceptance tests, which include:
     - Two DynamoDb tables
     - Three lambda Functions with two lambda Function URLs
     - One EventBridge scheduler

  1. Delete your local `cdk-output.json` file.
