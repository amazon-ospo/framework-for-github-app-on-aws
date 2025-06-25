# Framework for GitHub Apps on AWS

The **Framework for GitHub Apps on AWS** is an open-source software development framework
that uses AWS services to simplify the process of building and operating GitHub Apps.

Building and operating GitHub Apps securely
and in keeping with best practices
requires undifferentiated heavy lifting
by every App builder.
We want more people to build GitHub Apps.
We want it to be simple for those Apps to adhere to best practices.
We want GitHub App builders to be able to focus on
the unique value that their Apps bring to their users.

The mechanism that we have chosen to deliver this capability is
self-deployable infrastructure defined in
[AWS Cloud Development Kit (AWS CDK)](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
[Constructs](https://docs.aws.amazon.com/cdk/v2/guide/constructs.html)
that you can deploy in your applications.
Some of these constructs build APIs
that your business logic will need to call.
We provide
[Smithy](https://smithy.io/2.0/)
clients that you can use
to call these APIs that you deploy.
Finally,
some of these components require manual setup
which cannot be covered by AWS CDK constructs
or automation.
We provide operator tools
which seek to simplify and standardize these manual tasks.

## Getting Started

See the readme for each component for more information on how to get started with each.

- [Credential Manager](https://github.com/amazon-ospo/framework-for-github-app-on-aws/blob/main/src/packages/app-framework/README.md):
  This component keeps track of installations for one or more GitHub Apps
  and provides APIs that you can use
  to obtain GitHub credentials
  for each managed GitHub App and installation.
  Because every GitHub App that uses this framework is likely to need this component,
  it also includes some additional baseline functionality
  such as CloudWatch-based monitoring of
  [GitHub API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28)
  for each managed GitHub App installation.
- [Operator Tools](https://github.com/amazon-ospo/framework-for-github-app-on-aws/blob/main/src/packages/app-framework-ops-tools/README.md):
  Some operations,
  such as importing
  [GitHub App JWT signing keys](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps),
  cannot be automated at time of writing.
  This CLI tool seeks to simplify and standardize these manual tasks
  to reduce operator complexity
  and mitigate potential for error.

## Getting Help

Do you have questions or need help?
The best way to interact with our maintainers is through
[GitHub issues](https://github.com/amazon-ospo/framework-for-github-app-on-aws/issues/new/choose).

## Security Issues

Please do not report security issues through GitHub issues.
See our [security policy](https://github.com/amazon-ospo/framework-for-github-app-on-aws?tab=security-ov-file)
for instructions on how to report security issues.

## Contributing

Do you want to help develop this framework?
See our
[contributing guidelines](https://github.com/amazon-ospo/framework-for-github-app-on-aws/blob/main/CONTRIBUTING.md)
for how to get started.

## License

This project is licensed under the
[Apache-2.0 License](https://github.com/amazon-ospo/framework-for-github-app-on-aws/blob/main/LICENSE).
