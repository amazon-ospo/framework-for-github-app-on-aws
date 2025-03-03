import { awscdk } from "projen";
const project = new awscdk.AwsCdkConstructLibrary({
  author: "Amazon OSPO",
  authorAddress: "osa-dev+puzzleglue@amazon.com",
  cdkVersion: "2.1.0",
  defaultReleaseBranch: "main",
  jsiiVersion: "~5.7.0",
  name: "framework-for-github-app-on-aws",
  projenrcTs: true,
  repositoryUrl:
    "https://github.com/ajestharl/framework-for-github-app-on-aws.git",
  docgen: true,
  github: true,
  gitignore: [".idea"],
  eslint: true,
  eslintOptions: {
    prettier: true,
    fileExtensions: [".ts", ".md"],
    dirs: ["src", "test", "docs"],
  },
  jestOptions: {
    jestConfig: {
      verbose: true,
    },
  },
  cdkVersionPinning: false,
  release: false,
  autoMerge: false,
  releaseToNpm: false,
  workflowNodeVersion: '18.x',
  githubOptions: {
    workflows: true,
    pullRequestLint: true,
    mergify: false,
  },
  workflowGitIdentity: {
    name: 'github-actions',
    email: 'github-actions@github.com',
  },
});

// Modify the existing build workflow
if (project.github) {
  const buildWorkflow = project.github.tryFindWorkflow('build');
  if (buildWorkflow && buildWorkflow.file) {
    buildWorkflow.file.addOverride('jobs.build.steps.0.with', {
      token: '${{ secrets.PROJEN_GITHUB_TOKEN }}',
      'fetch-depth': 1,
      ref: '${{ github.event.pull_request.head.ref }}',
    });
  }
}

project.synth();
