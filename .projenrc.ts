import { awscdk, JsonFile, Project, typescript } from "projen";
import { TypeScriptAppProject } from "projen/lib/typescript";

const projectMetadata = {
  author: "Amazon OSPO",
  authorAddress: "osa-dev+puzzleglue@amazon.com",
  repositoryUrl:
    "https://github.com/amazon-ospo/framework-for-github-app-on-aws.git",
  cdkVersion: "2.189.1",
  constructsVersion: "10.4.2",
  defaultReleaseBranch: "main",
  name: "@aws/framework-for-github-app-on-aws",
};
const NODE_VERSION = ">18.0.0";

export const configureMarkDownLinting = (tsProject: TypeScriptAppProject) => {
  tsProject.addDevDeps(
    "eslint-plugin-md",
    "markdown-eslint-parser",
    "eslint-plugin-prettier",
  );
  tsProject.eslint?.addExtends(
    "plugin:md/recommended",
    "plugin:prettier/recommended",
  );
  tsProject.eslint?.addOverride({
    files: ["*.md"],
    parser: "markdown-eslint-parser",
    rules: {
      "prettier/prettier": ["error", { parser: "markdown" }],
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/return-await": "off",
      quotes: "off",
    },
  });
  tsProject.eslint?.addRules({
    "prettier/prettier": "error",
    "md/remark": [
      "error",
      {
        plugins: [
          "preset-lint-markdown-style-guide",
          ["lint-list-item-indent", "space"],
        ],
      },
    ],
  });
};

export const addTestTargets = (subProject: Project) => {
  const eslintTask = subProject.tasks.tryFind("eslint");
  const testTask = subProject.tasks.tryFind("test");
  if (testTask && eslintTask) {
    testTask.reset();
    testTask.exec(
      "jest --passWithNoTests --updateSnapshot --testPathIgnorePatterns=.*\\.accept\\.test\\.ts$",
      {
        receiveArgs: true,
      },
    );
    testTask.spawn(eslintTask);
  }

  const acceptTask = subProject.addTask("accept", {
    description: "Run all acceptance tests",
  });
  const defaultTask = subProject.tasks.tryFind("default");
  if (defaultTask) acceptTask.spawn(defaultTask);

  const preCompileTask = subProject.tasks.tryFind("pre-compile");
  if (preCompileTask) acceptTask.spawn(preCompileTask);

  const compileTask = subProject.tasks.tryFind("compile");
  if (compileTask) acceptTask.spawn(compileTask);

  const postCompileTask = subProject.tasks.tryFind("post-compile");
  if (postCompileTask) acceptTask.spawn(postCompileTask);

  acceptTask.exec("jest --passWithNoTests --updateSnapshot --group=accept", {
    receiveArgs: true,
  });
};

const theAppFrameworkScripts = (
  subProject: awscdk.AwsCdkConstructLibrary | typescript.TypeScriptProject,
) => {
  subProject.addScripts({
    cli: "ts-node ./src/app-framework-cli.ts",
  });
};

// Main Project Configuration
export const project = new awscdk.AwsCdkConstructLibrary({
  ...projectMetadata,
  jsiiVersion: "~5.7.0",
  projenrcTs: true,
  docgen: true,
  github: true,
  gitignore: [".idea", "cdk.out", "__snapshots__", "classpath.json"],
  eslint: true,
  eslintOptions: {
    prettier: true,
    fileExtensions: [".ts", ".md"],
    dirs: ["src", "test", "docs"],
    ignorePatterns: ["src/packages/smithy/build/**/*"],
  },
  jestOptions: {
    jestConfig: {
      runner: "groups",
      verbose: true,
    },
  },
  cdkVersionPinning: false,
  release: false,
  autoMerge: false,
  releaseToNpm: false,
  constructsVersion: "10.4.2",
  devDeps: ["lerna", "jest-runner-groups"],

  // deps: [],                /* Runtime dependencies of this module. /
  // description: undefined,  / The description is just a string that helps people understand the purpose of the package. /
  // devDeps: [],             / Build dependencies for this module. /
  // packageName: undefined,  / The "name" in package.json. */
});
if (project.github) {
  const buildWorkflow = project.github?.tryFindWorkflow("build");
  if (buildWorkflow && buildWorkflow.file) {
    buildWorkflow.file.addOverride("jobs.build.permissions.contents", "read");
    buildWorkflow.file.addOverride("jobs.build.env", {
      CI: "true",
      // Increasing heap size to mitigate potential "heap out of memory" errors during ESLint execution.
      // TODO: Need to find a better way to do this, but this works for now.
      NODE_OPTIONS: "--max-old-space-size=8192",
    });
  }
}
// Add Lerna configuration file (lerna.json)
new JsonFile(project, "lerna.json", {
  obj: {
    packages: ["src/packages/*", "src/packages/smithy/build/smithy/source/*"],
    version: "0.0.0",
    npmClient: "yarn",
  },
});
project.package.file.addOverride("private", true);
project.package.file.addOverride("workspaces", [
  "src/packages/*",
  "src/packages/smithy/build/smithy/source/*",
]);
// Run Lerna build one package at a time and,
// waits for each package to complete before showing its logs.
project.preCompileTask.exec("npx lerna run build --concurrency=1 --no-stream");
project.addScripts({
  cli: "ts-node src/packages/app-framework-ops-tools/src/app-framework-cli.ts",
});
project.addFields({
  engines: {
    node: NODE_VERSION,
  },
});
addTestTargets(project);
configureMarkDownLinting(project);

interface PackageConfig {
  name: string;
  outdir: string;
  deps?: string[];
  devDeps?: string[];
  bundledDeps?: string[];
}
const addPrettierConfig = (projectType: Project) => {
  new JsonFile(projectType, ".prettierrc.json", {
    obj: {
      singleQuote: true,
      trailingComma: "all",
    },
  });
};

export const createPackage = (config: PackageConfig) => {
  const tsProject = new awscdk.AwsCdkConstructLibrary({
    ...projectMetadata,
    name: config.name,
    outdir: config.outdir,
    parent: project,
    deps: config.deps,
    devDeps: config.devDeps,
    bundledDeps: config.bundledDeps,
    docgen: false,
  });
  theAppFrameworkScripts(tsProject);
  addTestTargets(tsProject);
  addPrettierConfig(tsProject);
  configureMarkDownLinting(tsProject);
  tsProject.addFields({
    engines: {
      node: NODE_VERSION,
    },
  });
  return tsProject;
};

createPackage({
  name: "@aws/framework-for-github-app-on-aws",
  outdir: "src/packages/app-framework",
  deps: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-kms",
    "aws-xray-sdk",
    "@aws-sdk/util-dynamodb",
    "@aws-smithy/server-common",
    "aws-lambda",
    "@aws-smithy/server-apigateway",
    "@aws/app-framework-ssdk",
    "re2-wasm",
    "@octokit/rest",
    "@octokit/types",
  ],
  devDeps: ["aws-sdk-client-mock"],
  bundledDeps: [
    "@aws-sdk/client-dynamodb",
    "@aws-smithy/server-common",
    "@aws-sdk/client-kms",
    "@aws-sdk/util-dynamodb",
    "aws-xray-sdk",
    "aws-lambda",
    "re2-wasm",
    "@aws-smithy/server-apigateway",
    "@aws/app-framework-ssdk",
    "@octokit/rest",
    "@octokit/types",
  ],
});

const theAppFrameworkOpsTools = new typescript.TypeScriptProject({
  ...projectMetadata,
  name: "@aws/app-framework-ops-tools",
  outdir: "src/packages/app-framework-ops-tools",
  parent: project,
  projenrcTs: false,
  repository: projectMetadata.repositoryUrl,
  deps: [
    "@aws-sdk/client-resource-groups-tagging-api",
    "@aws-sdk/client-kms",
    "@aws-sdk/client-dynamodb",
    "commander@^11.0.0",
  ],
  devDeps: [
    "aws-sdk-client-mock",
    "mock-fs",
    "@types/mock-fs",
    "jest-runner-groups",
  ],
  jestOptions: {
    jestConfig: {
      runner: "groups",
      verbose: true,
    },
  },
});
theAppFrameworkOpsTools.package.addBin({
  "app-framework-for-github-apps-on-aws-ops-tools": "lib/app-framework-cli.js",
});
theAppFrameworkOpsTools.addFields({
  engines: {
    node: NODE_VERSION,
  },
});
theAppFrameworkScripts(theAppFrameworkOpsTools);
addTestTargets(theAppFrameworkOpsTools);
addPrettierConfig(theAppFrameworkOpsTools);
configureMarkDownLinting(theAppFrameworkOpsTools);

const theAppFrameworkTestApp = new awscdk.AwsCdkTypeScriptApp({
  ...projectMetadata,
  name: "@aws/app-framework-test-app",
  outdir: "src/packages/app-framework-test-app",
  parent: project,
  projenrcTs: false,
  repository: projectMetadata.repositoryUrl,
  cdkVersion: "2.184.1",
  deps: [
    "@aws-sdk/hash-node",
    "@aws/framework-for-github-app-on-aws",
    "@aws/app-framework-client",
    "@aws-crypto/sha256-js",
    "@aws-sdk/credential-provider-node",
  ],
  devDeps: ["jest-runner-groups"],
  jestOptions: {
    jestConfig: {
      runner: "groups",
      verbose: true,
    },
  },
});
theAppFrameworkTestApp.addFields({
  engines: {
    node: NODE_VERSION,
  },
});
addTestTargets(theAppFrameworkTestApp);
addPrettierConfig(theAppFrameworkTestApp);
configureMarkDownLinting(theAppFrameworkTestApp);
project.synth();
