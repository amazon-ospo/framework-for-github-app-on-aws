# Framework for GitHub Apps on AWS

The **Framework for GitHub Apps on AWS** is an open-source software development
framework to define ways to maintain GitHub App credentials using AWS CDK constructs.

It is comprised of a CLI tool to import GitHub App Private Key using KMS 
and Lambda function urls from a L3 CDK construct 
to generate tokens to manage credentials of different App installations 
which can be called using published smithy clients.

The CLI tool, the L3 CDK constructs and the smithy generated clients 
are available in the following languages:
* JavaScript, TypeScript ([Node.js >= 18.x](https://nodejs.org/en/download))

\
Jump To:
[GitHub App Private Key Management Scripts](https://github.com/amazon-ospo/framework-for-github-app-on-aws/blob/main/src/packages/app-framework-ops-tools/README.md) |
[Credential Manager](https://github.com/amazon-ospo/framework-for-github-app-on-aws/blob/main/src/packages/app-framework/README.md) |
[Getting Started](#getting-started) |
[Getting Help](#getting-help) |
[Contributing](#contributing) |
_____
Developers would generally use the CLI tool to import private keys 
from GitHub Apps to AWS KMS. The private key is deleted 
after the importing process is finished.

They then would use the L3 CDK construct on their personal stack and then
deploy the cdk construct generating Lambda function urls to generate 
the App Token and the Installation access token and also with a choice
of adding a rate limit dashboard to keep track of calls to GitHub APIs regarding the app.

After deploying the CDK construct, the smithy generated clients will be used to make API calls
to retrieve either the App Token or the Installation Access Token to make [GitHub REST API calls](https://docs.github.com/en/rest?apiVersion=2022-11-28) regarding any information
that is necessary from the GitHub App Installations.

## Getting Started

Follow the steps below to set up your environment before using the framework:
- [GitHub App Private Key Management Scripts](https://github.com/amazon-ospo/framework-for-github-app-on-aws/blob/main/src/packages/app-framework-ops-tools/README.md)
- [Credential Manager](https://github.com/amazon-ospo/framework-for-github-app-on-aws/blob/main/src/packages/app-framework/README.md)

## Getting Help

The best way to interact with our team is through GitHub. 
You can open an [issue](https://github.com/amazon-ospo/framework-for-github-app-on-aws/issues/new/choose) and choose from one of our templates for bug reports, feature requests, documentation issues, or guidance.

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.

