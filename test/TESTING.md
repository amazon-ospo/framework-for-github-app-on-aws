# Acceptance Tests

This document outlines the common prerequisites for
running acceptance tests across the packages in this repository.
There are acceptance tests in:

[app-framework-ops-tool](../src/packages/app-framework-ops-tools/test/TESTING.md):
for importing GitHub App's private key into AWS KMS

[app-framework-test-app](../src/packages/app-framework-test-app/test/TESTING.md):
for retrieving GitHub App token and Installation token

This document helps you set up shared prerequisites.
Please also refer to each package’s `TESTING.md` for specific instructions.

## Overview

The `framework-for-github-app-on-aws` Credential Manager is an L3 CDK construct
that provisions infrastructure in your AWS account.

To run acceptance tests, you must:

1. Deploy the infrastructure
1. Download the GitHub Private Key from GitHub website to your local

Credential Manager APIs use these setup to import GitHub App private key
to AWS KMS and generate GitHub tokens securely.

**IMPORTANT:** This process interacts with live AWS services and will:

- Create AWS resources (incurs costs)
- Create KMS keys
- Store data in DynamoDB
- Make calls to GitHub’s API
- Perform cryptographic operations
- Run a scheduler job to sync GitHub App installations.

Monitor your AWS usage and billing carefully.
Repeated test runs may accumulate inactive KMS keys.

## Prerequisites

1. Deploy Credential Manager instance in your AWS account:

   At the top level directory of `app-framework-test-app` package, run

   ```sh
     npx projen depoy
   ```

   Which will deploy testing stack
   `the-app-framework-test-stack` in your AWS account.
   It will also create a Nested stack with the name begin with
   `the-app-framework-test-stack-CredentialManagerNestedStack`.
   Under this stack, it will create:
   - Two DynamoDb table
   - Three lambda Function with two lambda Function URL
   - One EventBridge Scheduler

1. Go to GitHub, install a GitHub App and download the private key
   which is a file in PEM format.

1. Keep a track of the file location for the import process.
