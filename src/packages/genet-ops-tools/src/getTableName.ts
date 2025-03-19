import {
  ResourceGroupsTaggingAPIClient,
  GetResourcesCommand,
  GetResourcesCommandOutput,
} from '@aws-sdk/client-resource-groups-tagging-api';
import {
  GENET_COMPONENT,
  CREDENTIAL_MANAGER,
  APP_TABLE,
  RESOURCES_PER_PAGE,
} from './constants';
const taggingClient = new ResourceGroupsTaggingAPIClient({});

/**
 * Fetches DynamoDB tables tagged with GENET_COMPONENT and CREDENTIAL_MANAGER
 * and APP_TABLE
 * @returns Array of table names that match the tag criteria
 */
export const listTablesByTags = async (): Promise<string[]> => {
  let allTables: string[] = [];
  let paginationToken: string | undefined;
  do {
    const command = new GetResourcesCommand({
      ResourceTypeFilters: ['dynamodb:table'],
      TagFilters: [
        { Key: GENET_COMPONENT, Values: [CREDENTIAL_MANAGER] },
        { Key: CREDENTIAL_MANAGER, Values: [APP_TABLE] },
      ],
      PaginationToken: paginationToken,
      ResourcesPerPage: RESOURCES_PER_PAGE,
    });

    try {
      const response: GetResourcesCommandOutput =
        await taggingClient.send(command);
      if (response && response.ResourceTagMappingList) {
        const tableNames = response.ResourceTagMappingList.map(
          (resource) => resource.ResourceARN?.split('/').pop()!,
        );
        allTables.push(...tableNames);
      }
      paginationToken = response.PaginationToken;
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  } while (paginationToken);

  return allTables;
};

export type DisplayDynamoDBTables = ({
  listTables,
}: {
  listTables?: () => Promise<string[]>;
}) => Promise<void>;

/**
 * Displays a list of DynamoDB tables that match specific criteria.
 * Lists tables in a numbered format and shows the total count.
 *
 * ---
 * dependency injection parameters:
 *
 * @param listTables Function that fetches the dynamoDB tables tagged with GENET_COMPONENT and CREDENTIAL_MANAGER
 *
 * @example
 * // Output:
 * // Available tables:
 * // 1. table1
 * // 2. table2
 * // Total tables found: 2
 */
export const displayDynamoDBTables: DisplayDynamoDBTables = async ({
  listTables = listTablesByTags,
}) => {
  try {
    const tables = await listTables();
    if (tables.length === 0) {
      console.log('No tables found with the specified tags');
      return;
    }
    console.log('\nAvailable tables:');
    tables.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    console.log(`\nTotal tables found: ${tables.length}\n`);
  } catch (error) {
    console.error('Failed to list tables:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  displayDynamoDBTables({}).catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
