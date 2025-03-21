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
describe('getTableName Acceptance Tests', () => {
  let actualTableNames: string[];
  it('should list actual tables that are tagged CREDENTIAL_MANAGER:APP_TABLE', async () => {
    actualTableNames = await listTablesByTags();
    console.log('\nTables found with CREDENTIAL_MANAGER:APP_TABLE tag:');
    actualTableNames.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    expect(Array.isArray(actualTableNames)).toBeTruthy();
    expect(actualTableNames.length).toBeGreaterThan(0);
  });
});
