#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';
import { displayDynamoDBTables } from './getTableName';
import { importPrivateKey } from './importPrivateKey';

const program = new Command();
/**
 * CLI tool for Importing GitHub App private key into AWS KMS
 * Main command - 'app-framework'
 */
program
  .name('app-framework')
  .description(
    'CLI tool to get name of the App table with FrameworkForGitHubAppOnAwsManaged tag and to import GitHub App private key into AWS KMS',
  )
  .version(version);
// subcommand - getTableName
program
  .command('getTableName')
  .description('Displays App tables with FrameworkForGitHubAppOnAwsManaged tag')
  .action(async () => {
    try {
      await displayDynamoDBTables({});
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });
// subcommand - importPrivateKey
program
  .command('importPrivateKey')
  .description('Import GitHub App private key into AWS KMS')
  .argument('<pemFilePath>', 'Path to the private key PEM file')
  .argument('<appId>', 'GitHub App ID')
  .argument('<tableName>', 'Table name to store the AppId and Key ARN')
  .addHelpText(
    'after',
    `
    Example:
      $ app-framework importPrivateKey private-key.pem 123456 my-table-name
  `,
  )
  .action(
    async (pemFilePath: string, appIdAsString: string, tableName: string) => {
      try {
        const appId = Number(appIdAsString);
        if (isNaN(appId)) {
          console.error('Error: GitHub AppId must be a valid number');
          process.exit(1);
        }

        await importPrivateKey({ pemFilePath, appId, tableName });
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    },
  );
program.parse(process.argv);
