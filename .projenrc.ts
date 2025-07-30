import { awscdk, JsonFile, Project, typescript } from "projen";
import { JobPermission } from "projen/lib/github/workflows-model";
import { TypeScriptAppProject } from "projen/lib/typescript";

const projectMetadata = {
  author: "Amazon OSPO",
  authorAddress: "osa-dev+puzzleglue@amazon.com",
  repositoryUrl:
    "https://github.com/amazon-ospo/framework-for-github-app-on-aws.git",
  cdkVersion: "2.189.1",
  constructsVersion: "10.4.2",
  defaultReleaseBranch: "main",
  name: "@aws/app-framework-for-github-apps-on-aws",
};
const NODE_VERSION = ">18.0.0";

const RELEASE_PACKAGES = [
  "@aws/app-framework-for-github-apps-on-aws-ops-tools",
  "@aws/app-framework-for-github-apps-on-aws-client",
  "@aws/app-framework-for-github-apps-on-aws-ssdk",
  "@aws/app-framework-for-github-apps-on-aws",
];

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
    release: false,
    releaseToNpm: false,
  });
  addTestTargets(tsProject);
  addPrettierConfig(tsProject);
  configureMarkDownLinting(tsProject);
  tsProject.addFields({
    engines: {
      node: NODE_VERSION,
    },
  });
  tsProject.package.addField("publishConfig", {
    access: "public",
  });
  return tsProject;
};

createPackage({
  name: "@aws/app-framework-for-github-apps-on-aws",
  outdir: "src/packages/app-framework",
  deps: [
    "@aws-lambda-powertools/metrics",
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-kms",
    "aws-xray-sdk",
    "@aws-sdk/util-dynamodb",
    "@aws-smithy/server-common",
    "aws-lambda",
    "@aws-smithy/server-apigateway",
    "@aws/app-framework-for-github-apps-on-aws-ssdk",
    "re2-wasm",
    "@octokit/rest",
    "@octokit/types",
  ],
  devDeps: ["aws-sdk-client-mock"],
  bundledDeps: [
    "@aws-lambda-powertools/metrics",
    "@aws-sdk/client-dynamodb",
    "@aws-smithy/server-common",
    "@aws-sdk/client-kms",
    "@aws-sdk/util-dynamodb",
    "aws-xray-sdk",
    "aws-lambda",
    "re2-wasm",
    "@aws-smithy/server-apigateway",
    "@aws/app-framework-for-github-apps-on-aws-ssdk",
    "@octokit/rest",
    "@octokit/types",
  ],
});

const theAppFrameworkOpsTools = new typescript.TypeScriptProject({
  ...projectMetadata,
  name: "@aws/app-framework-for-github-apps-on-aws-ops-tools",
  outdir: "src/packages/app-framework-ops-tools",
  parent: project,
  projenrcTs: false,
  release: false,
  releaseToNpm: false,
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
theAppFrameworkOpsTools.package.addField("publishConfig", {
  access: "public",
});
theAppFrameworkOpsTools.addScripts({
  cli: "ts-node ./src/app-framework-cli.ts",
});
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
    "@aws/app-framework-for-github-apps-on-aws",
    "@aws/app-framework-for-github-apps-on-aws-client",
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

// Centralized Release Workflow - Coordinates automatic release of all packages
const centralizedRelease = project.github?.addWorkflow("centralized-release");
if (centralizedRelease) {
  centralizedRelease.on({
    push: { branches: ["main"] },
  });

  centralizedRelease.addJobs({
    // Step 1: Calculate next version and validate release conditions
    setup_release: {
      runsOn: ["ubuntu-latest"],
      permissions: {
        contents: JobPermission.READ,
      },
      outputs: {
        version: {
          stepId: "next_version",
          outputName: "version",
        },
        tag_exists: {
          stepId: "next_version",
          outputName: "tag_exists",
        },
        latest_commit: {
          stepId: "git_remote",
          outputName: "latest_commit",
        },
      },
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v4",
          with: { "fetch-depth": 0 },
        },
        {
          name: "Set Git Identity",
          run: [
            'git config --global user.email "github-actions@github.com"',
            'git config --global user.name "GitHub Actions"',
          ].join("\n"),
        },
        {
          // Query NPM registry for current versions of all packages
          name: "Fetch current NPM package versions",
          id: "npm_versions",
          run: [
            'get_version() { npm view "$1" version 2>/dev/null || echo "0.0.0"; }',
            `PACKAGES="${RELEASE_PACKAGES.join(" ")}"`,
            "VERSIONS=()",
            'echo "Found NPM versions:"',
            "for pkg in $PACKAGES; do",
            '  version=$(get_version "$pkg")',
            '  echo "$pkg: $version"',
            '  VERSIONS+=("$version")',
            "done",
            'LATEST_NPM=$(printf "%s\\n" "${VERSIONS[@]}" | sort -V | tail -n1)',
            'echo "Latest NPM version: $LATEST_NPM"',
            'echo "latest_npm=$LATEST_NPM" >> $GITHUB_OUTPUT',
          ].join("\n"),
        },
        {
          // Find next version that doesn't conflict with existing Git tags
          // Handles failed release recovery by skipping existing tags
          name: "Find Next Available Version",
          id: "next_version",
          run: [
            'LATEST_NPM="${{ steps.npm_versions.outputs.latest_npm }}"',
            'IFS="." read -r major minor patch <<< "$LATEST_NPM"',
            'CANDIDATE_VERSION="$major.$minor.$((patch + 1))"',
            'echo "Starting with candidate version: $CANDIDATE_VERSION"',
            'while git ls-remote --tags origin "refs/tags/v$CANDIDATE_VERSION" | grep -q "v$CANDIDATE_VERSION"; do',
            '  echo "Tag v$CANDIDATE_VERSION already exists, trying next version"',
            "  patch=$((patch + 1))",
            '  CANDIDATE_VERSION="$major.$minor.$patch"',
            "done",
            'echo "Next available version: $CANDIDATE_VERSION"',
            'echo "version=$CANDIDATE_VERSION" >> $GITHUB_OUTPUT',
            'echo "tag_exists=false" >> $GITHUB_OUTPUT',
          ].join("\n"),
        },
        {
          name: "Check for new commits",
          id: "git_remote",
          run: [
            'echo "latest_commit=$(git ls-remote origin -h ${{ github.ref }} | cut -f1)" >> $GITHUB_OUTPUT',
          ].join("\n"),
        },
      ],
    },

    // Step 2: Build all packages in parallel with determined version
    // Each job creates a build artifact for later publishing
    app_framework_for_github_apps_on_aws_ops_tools: {
      if: "needs.setup_release.outputs.tag_exists != 'true' && needs.setup_release.outputs.latest_commit == github.sha",
      needs: ["setup_release"],
      permissions: {
        contents: JobPermission.READ,
        idToken: JobPermission.WRITE,
      },
      uses: "./.github/workflows/build-package-artifact.yml",
      with: {
        version: "${{ needs.setup_release.outputs.version }}",
        package_name: "app-framework-for-github-apps-on-aws-ops-tools",
        package_path: "src/packages/app-framework-ops-tools",
      },
      secrets: "inherit",
    },

    app_framework_for_github_apps_on_aws_client: {
      if: "needs.setup_release.outputs.tag_exists != 'true' && needs.setup_release.outputs.latest_commit == github.sha",
      needs: ["setup_release"],
      permissions: {
        contents: JobPermission.READ,
        idToken: JobPermission.WRITE,
      },
      uses: "./.github/workflows/build-package-artifact.yml",
      with: {
        version: "${{ needs.setup_release.outputs.version }}",
        package_name: "app-framework-for-github-apps-on-aws-client",
        package_path:
          "src/packages/smithy/build/smithy/source/typescript-client-codegen",
      },
      secrets: "inherit",
    },

    app_framework_for_github_apps_on_aws_ssdk: {
      if: "needs.setup_release.outputs.tag_exists != 'true' && needs.setup_release.outputs.latest_commit == github.sha",
      needs: ["setup_release"],
      permissions: {
        contents: JobPermission.READ,
        idToken: JobPermission.WRITE,
      },
      uses: "./.github/workflows/build-package-artifact.yml",
      with: {
        version: "${{ needs.setup_release.outputs.version }}",
        package_name: "app-framework-for-github-apps-on-aws-ssdk",
        package_path:
          "src/packages/smithy/build/smithy/source/typescript-ssdk-codegen",
      },
      secrets: "inherit",
    },

    app_framework_for_github_apps_on_aws: {
      if: "needs.setup_release.outputs.tag_exists != 'true' && needs.setup_release.outputs.latest_commit == github.sha",
      needs: ["setup_release"],
      permissions: {
        contents: JobPermission.READ,
        idToken: JobPermission.WRITE,
      },
      uses: "./.github/workflows/build-package-artifact.yml",
      with: {
        version: "${{ needs.setup_release.outputs.version }}",
        package_name: "app-framework-for-github-apps-on-aws",
        package_path: "src/packages/app-framework",
      },
      secrets: "inherit",
    },

    // Step 3: Publish all packages atomically after successful builds
    npm_publish: {
      needs: [
        "setup_release",
        "app_framework_for_github_apps_on_aws_ops_tools",
        "app_framework_for_github_apps_on_aws_client",
        "app_framework_for_github_apps_on_aws_ssdk",
        "app_framework_for_github_apps_on_aws",
      ],
      runsOn: ["ubuntu-latest"],
      permissions: {
        contents: JobPermission.WRITE,
        idToken: JobPermission.WRITE,
      },
      env: {
        CI: "true",
      },
      if: "needs.setup_release.outputs.tag_exists != 'true' && needs.setup_release.outputs.latest_commit == github.sha",
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v4",
          with: { "fetch-depth": 0 },
        },
        {
          name: "Set Git Identity",
          run: [
            'git config --global user.email "github-actions@github.com"',
            'git config --global user.name "GitHub Actions"',
          ].join("\n"),
        },
        {
          name: "Set package list",
          run: `echo "PACKAGES=${RELEASE_PACKAGES.join(" ")}" >> $GITHUB_ENV`,
        },
        {
          name: "Setup Node.js",
          uses: "actions/setup-node@v4",
          with: {
            "node-version": "lts/*",
            "registry-url": "https://registry.npmjs.org",
          },
        },
        {
          name: "Download artifacts",
          uses: "actions/download-artifact@v4",
          with: {
            "merge-multiple": true,
          },
        },
        {
          name: "Extract package artifacts for publishing",
          run: [
            "for pkg in $PACKAGES; do",
            '  echo "Extracting $pkg..."',
            "  # Extract just the package name (remove scope)",
            '  dir_name=$(echo "$pkg" | sed "s|.*/||")',
            "  # Use the same package name that was passed to build workflow",
            '  safe_name="$dir_name"',
            '  mkdir -p "$dir_name"',
            '  tar -xzf "${safe_name}.tgz" -C "$dir_name" --strip-components=1',
            "done",
          ].join("\n"),
        },
        {
          name: "Patch version and Remove prepack in each package",
          run: [
            'version="${{ needs.setup_release.outputs.version }}"',
            "for pkg in $PACKAGES; do",
            '  dir_name=$(echo "$pkg" | sed "s|.*/||")',
            '  echo "Patching version in $dir_name/package.json"',
            '  cd "$dir_name"',
            "  jq --arg ver \"$version\" '.version = $ver' package.json > tmp.json && mv tmp.json package.json",
            "  jq 'del(.scripts.prepack)' package.json > tmp.json && mv tmp.json package.json",
            "  cd ..",
            "done",
          ].join("\n"),
        },
        {
          name: "Publish all packages to NPM registry",
          id: "publish",
          env: {
            NODE_AUTH_TOKEN: "${{ secrets.NPM_TOKEN }}",
          },
          run: [
            "version='${{ needs.setup_release.outputs.version }}'",
            "for pkg in $PACKAGES; do",
            '  dir_name=$(echo "$pkg" | sed "s|.*/||")',
            '  echo "Publishing $pkg@$version"',
            '  cd "$dir_name"',
            "  npm publish --access public",
            '  echo "Successfully published $pkg@$version"',
            "  cd ..",
            "done",
            'echo "All packages published successfully"',
            'echo "publishing_failed=false" >> $GITHUB_OUTPUT',
          ].join("\n"),
        },
        {
          // Create Git tag only after successful NPM publishing
          // This ensures tags only exist for successfully released versions
          name: "Create Git Tag",
          workingDirectory: "${{ github.workspace }}",
          run: [
            'TAG="v${{ needs.setup_release.outputs.version }}"',
            'git tag "$TAG"',
            'git push origin "$TAG"',
            'echo "Created and pushed tag: $TAG"',
          ].join("\n"),
        },
      ],
    },
    // Step 4: Create GitHub release with all package artifacts
    github_release: {
      if: "needs.setup_release.outputs.tag_exists != 'true' && needs.setup_release.outputs.latest_commit == github.sha",
      needs: ["npm_publish", "setup_release"],
      runsOn: ["ubuntu-latest"],
      permissions: {
        contents: JobPermission.WRITE,
      },
      env: {
        CI: "true",
      },
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v4",
        },
        {
          name: "Download all artifacts",
          uses: "actions/download-artifact@v4",
          with: {
            "merge-multiple": true,
          },
        },
        {
          name: "Create GitHub Release",
          env: {
            GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
          },
          run: [
            'gh release create "v${{ needs.setup_release.outputs.version }}"',
            '--title "v${{ needs.setup_release.outputs.version }}"',
            '--notes "Automated release for all packages"',
            "--target $(git rev-parse HEAD)",
            "*.tgz",
          ].join(" "),
        },
      ],
    },
  });
}

// Prevent concurrent releases to avoid version conflicts
// cancel-in-progress: false ensures running releases complete
if (centralizedRelease) {
  centralizedRelease.file?.addOverride("concurrency", {
    group: "release",
    "cancel-in-progress": false,
  });
}

// Reusable workflow for building individual package artifacts
// Called by each package job in the centralized release
const buildArtifactWorkflow = project.github?.addWorkflow(
  "build-package-artifact",
);

if (buildArtifactWorkflow) {
  buildArtifactWorkflow.on({
    workflowCall: {
      inputs: {
        version: { required: true, type: "string" },
        package_name: { required: true, type: "string" },
        package_path: { required: true, type: "string" },
      },
    },
  });

  buildArtifactWorkflow.addJobs({
    build_artifacts: {
      runsOn: ["ubuntu-latest"],
      permissions: {
        contents: JobPermission.READ,
        idToken: JobPermission.WRITE,
      },
      env: {
        CI: "true",
      },
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v4",
          with: { "fetch-depth": 0 },
        },
        {
          name: "Setup Node.js",
          uses: "actions/setup-node@v4",
          with: {
            "node-version": "lts/*",
            "registry-url": "https://registry.npmjs.org",
          },
        },
        {
          name: "Install dependencies",
          run: "yarn install --check-files --frozen-lockfile",
        },
        {
          name: "Build package",
          run: "yarn build",
          workingDirectory: "${{ inputs.package_path }}",
        },
        {
          name: "Ensure bundled dependencies are installed",
          run: [
            "rm -rf node_modules package-lock.json",
            "npm install --legacy-peer-deps --no-workspaces",
          ].join(" && "),
          workingDirectory: "${{ inputs.package_path }}",
        },
        {
          name: "Pack artifact",
          run: 'npm pack --pack-destination . && mv *.tgz "${{ inputs.package_name }}.tgz"',
          workingDirectory: "${{ inputs.package_path }}",
        },
        {
          name: "Backup artifact permissions",
          workingDirectory: "${{ inputs.package_path }}",
          run: [
            "mkdir -p dist",
            'cp "${{ inputs.package_name }}.tgz" dist/',
            "cd dist && getfacl -R . > permissions-backup.acl",
          ].join(" && "),
        },
        {
          name: "Prepare for publishing",
          run: [
            "cd dist",
            'tar -xzf "${{ inputs.package_name }}.tgz" --strip-components=1',
          ].join(" && "),
          workingDirectory: "${{ inputs.package_path }}",
        },
        {
          name: "Upload artifact",
          uses: "actions/upload-artifact@v4.4.0",
          with: {
            name: "${{ inputs.package_name }}",
            path: "${{ inputs.package_path }}/dist",
            overwrite: true,
          },
        },
      ],
    },
  });
}
project.synth();
