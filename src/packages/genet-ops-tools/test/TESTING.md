# Acceptance Tests for Importing Private Key into AWS KMS

This document describes running of acceptance tests for importing private key,
which performs end-to-end testing of the GitHub App private key import
functionality against real AWS and GitHub resources.

## Overview

The test suite validates the complete workflow
from importing a private key to using it for JWT signing.

**IMPORTANT:** These tests interact with live AWS services and will:

- Create AWS resources (which may incur costs)

  - Each execution of tests create 2 KMS keys

  - Each subsequent test run keeps on adding 2 KMS keys while
    keeping old ones in pending deletion state for a window of 30 days.

- Store data in DynamoDB table

- Make calls to GitHub's API

- Perform cryptographic operations

- Delete the PEM file after successful import

- **Note:** Monitor your AWS costs carefully as multiple test runs will
  accumulate KMS keys.

## Prerequisites

1. Install a GitHub App and download the private key which is a file in PEM
   format.

1. Keep a track of the file location for the import process

1. Configure AWS credentials with appropriate permissions

## Running Tests

1. List available DynamoDB tables:

```sh
   npm run get-table-name
   ```

1. Set required environment variables:

For `DYNAMODB_TABLE_NAME`, select an appropriate table name from the output of above command.

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
