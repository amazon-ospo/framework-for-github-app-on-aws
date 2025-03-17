import { awscdk, JsonFile } from "projen";
import { TypeScriptAppProject } from "projen/lib/typescript";

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

export const project = new awscdk.AwsCdkConstructLibrary({
  author: "Amazon OSPO",
  authorAddress: "osa-dev+puzzleglue@amazon.com",
  cdkVersion: "2.1.0",
  defaultReleaseBranch: "main",
  jsiiVersion: "~5.7.0",
  name: "framework-for-github-app-on-aws",
  projenrcTs: true,
  repositoryUrl:
    "https://github.com/amazon-ospo/framework-for-github-app-on-aws.git",
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
      NODE_OPTIONS: "--max-old-space-size=8192",
    });
  }
}
configureMarkDownLinting(project);

interface PackageConfig {
  name: string;
  outdir: string;
  deps?: string[];
  devDeps?: string[];
}

export const createPackage = (config: PackageConfig) => {
  const tsProject = new awscdk.AwsCdkTypeScriptApp({
    parent: project,
    outdir: config.outdir,
    cdkVersion: "2.1.0",
    defaultReleaseBranch: "main",
    name: config.name,
    projenrcTs: false,
    deps: config.deps || [],
    devDeps: config.devDeps || [],
  });
  new JsonFile(tsProject, ".prettierrc.json", {
    obj: {
      singleQuote: true,
      trailingComma: "all",
    },
  });
  configureMarkDownLinting(tsProject);
  return tsProject;
};

createPackage({
  name: "genet-framework",
  outdir: "src/packages/genet-framework",
});
createPackage({
  name: "genet-ops-tools",
  outdir: "src/packages/genet-ops-tools",
});

project.synth();
