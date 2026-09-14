import { spawn } from 'child_process';
import { redactSecrets } from '../logger';

export interface CommandExecutionResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  success: boolean;
}

const ALLOWLISTED_COMMAND_PREFIXES = [
  'npm install',
  'npm test',
  'npm run build',
  'npm run lint',
  'npm run test',
  'npx vitest run',
  'npx vitest',
  'npx jest',
  'npx tsc --noEmit',
  'npx tsc',
];

/**
 * Validates whether a command matches the strict allowlist policy.
 */
export function isCommandAllowlisted(cmd: string): boolean {
  const trimmed = cmd.trim();
  return ALLOWLISTED_COMMAND_PREFIXES.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix} `)
  );
}

/**
 * Executes an allowlisted command inside an isolated workspace with strict timeouts,
 * sanitized environment variables, and captured output.
 */
export async function executeInSandbox(
  workspaceDir: string,
  command: string,
  timeoutMs: number = 60000
): Promise<CommandExecutionResult> {
  if (!isCommandAllowlisted(command)) {
    return {
      command,
      exitCode: 126,
      stdout: '',
      stderr: `Security Exception: Command '${command}' is not on the CodeMedic allowlist. Only standard npm/npx build & test commands are permitted.`,
      durationMs: 0,
      timedOut: false,
      success: false,
    };
  }

  const startTime = Date.now();

  // Sanitize environment variables - strip keys, tokens, DB urls
  const safeEnv: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    SYSTEMROOT: process.env.SYSTEMROOT,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP,
    HOMEPATH: process.env.HOMEPATH,
    USERPROFILE: process.env.USERPROFILE,
    NODE_ENV: 'test',
    CI: 'true',
  };

  return new Promise((resolve) => {
    let stdoutBuffer = '';
    let stderrBuffer = '';
    let timedOut = false;

    // Use cmd.exe /c on Windows or sh -c on Unix
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd.exe' : '/bin/sh';
    const shellArgs = isWindows ? ['/d', '/s', '/c', command] : ['-c', command];

    const child = spawn(shell, shellArgs, {
      cwd: workspaceDir,
      env: safeEnv,
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGTERM');
      } catch {
        // Ignore
      }
    }, timeoutMs);

    child.stdout?.on('data', (data) => {
      stdoutBuffer += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderrBuffer += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      const exitCode = timedOut ? 124 : (code ?? 1);

      resolve({
        command,
        exitCode,
        stdout: redactSecrets(stdoutBuffer),
        stderr: redactSecrets(
          timedOut ? `${stderrBuffer}\n[CodeMedic Execution Timeout after ${timeoutMs}ms]` : stderrBuffer
        ),
        durationMs,
        timedOut,
        success: exitCode === 0,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      resolve({
        command,
        exitCode: 1,
        stdout: redactSecrets(stdoutBuffer),
        stderr: redactSecrets(`${stderrBuffer}\n${err.message}`),
        durationMs,
        timedOut: false,
        success: false,
      });
    });
  });
}
