import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
const cliPath = path.resolve(__dirname, '../lib/app-framework-cli.js');

const execCLI = (
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> => {
  return new Promise((resolve) => {
    const proc = spawn(cliPath, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
};

/**
 * @group accept
 */
describe('app-framework CLI Acceptance tests', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliPath)) {
      throw new Error(
        `CLI not built: ${cliPath} not found. Run \`npx projen build\` first.`,
      );
    }
    // Ensure it's executable
    fs.chmodSync(cliPath, 0o755);
  });

  describe('app-framework main command', () => {
    it('displays help information', async () => {
      const { code, stdout, stderr } = await execCLI(['--help']);

      expect(code).toBe(0);
      expect(stdout).toContain('Usage: app-framework');
      expect(stdout).toContain('Commands:');
      expect(stdout).toContain('get-table-name');
      expect(stdout).toContain('import-private-key');
      expect(stderr).toBe('');
    });

    it('displays version information', async () => {
      const { code, stdout, stderr } = await execCLI(['--version']);
      expect(code).toBe(0);
      expect(stdout).toMatch(/\d+\.\d+\.\d+/); // Matches semver format - patterns like: 1.0.0, 2.3.4
      expect(stderr).toBe('');
    });

    it('should show error for unknown command', async () => {
      const { code, stdout } = await execCLI(['unknown-command']);
      expect(code).toBe(0);
      expect(stdout).toContain(
        'Usage: app-framework-for-github-apps-on-aws-ops-tools [options] [command]',
      );
    });

    it('should show error for invalid option', async () => {
      const { code, stderr } = await execCLI(['--invalid-option']);
      expect(code).not.toBe(0);
      expect(stderr).toContain('unknown option');
    });
  });

  describe('get-table-name subcommand', () => {
    it('displays available tables or shows "no tables found" message', async () => {
      const { code, stdout, stderr } = await execCLI(['get-table-name']);
      expect(code).toBe(0);
      expect(stdout).toContain('Available tables:');
      expect(stdout).toContain('Total tables found:');
      expect(stderr).toBe('');
    });
  });

  describe('import-private-key subcommand', () => {
    it.each([
      ['pemFilePath', 'import-private-key'],
      ['appId', 'import-private-key private-key.pem'],
      ['tableName', 'import-private-key private-key.pem 12345'],
    ])(
      'import-private-key command should fail when <%s> argument is missing',
      async (missingArg, command) => {
        const { code, stderr } = await execCLI(command.split(' '));
        expect(code).toBe(1);
        expect(stderr).toMatch(
          `error: missing required argument '${missingArg}'`,
        );
      },
    );

    it('fails when AppId is not a number', async () => {
      const { code, stderr } = await execCLI([
        'import-private-key',
        'key.pem',
        'not-a-number',
        'table-name',
      ]);
      expect(code).toBe(1);
      expect(stderr).toContain('Error: GitHub AppId must be a valid number');
    });
  });
});
