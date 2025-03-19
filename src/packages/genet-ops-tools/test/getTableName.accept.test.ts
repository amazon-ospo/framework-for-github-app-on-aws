import { listTablesByTags } from '../src/getTableName';

/**
 * Acceptance tests for `getTable.ts`
 * This test suite lists the DynamoDB tables tagged with
 * - Key: GENET_COMPONENT, Values: [CREDENTIAL_MANAGER]
 * - Key: CREDENTIAL_MANAGER, Values: [APP_TABLE]
 *
 * Run the tests using `npm run accept`.
 */
/**
 * @group accept
 */
describe('getTable Acceptance Tests', () => {
  let actualTableNames: string[];
  it('should list actual tables when available', async () => {
    actualTableNames = await listTablesByTags();
    console.log('\nTables found with tags:');
    actualTableNames.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    expect(Array.isArray(actualTableNames)).toBeTruthy();
    if (actualTableNames.length > 0) {
      console.log(`
        To run import private key tests, set the below environment variables:
        For DYNAMODB_TABLE_NAME, pick the tableName from the list displayed in this test.
        
        export GITHUB_PEM_FILE_PATH=/path/to/your/private-key.pem
        export GITHUB_APP_ID=your-github-app-id
        export DYNAMODB_TABLE_NAME=<select-table-from-above>
        `);
    } else {
      console.log('No tables found with the specified tags');
    }
  });
});
