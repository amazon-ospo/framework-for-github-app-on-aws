import { awscdk } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Ajitha Estharla',
  authorAddress: 'aestharl@amazon.com',
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.7.0',
  name: 'framework-for-github-app-on-aws',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/ajestharl/framework-for-github-app-on-aws.git',

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();