import fs from 'fs';
import path from 'path';
import os from 'os';

export class WorkspaceManager {
  private baseDir: string;

  constructor() {
    // Isolated workspace directory
    this.baseDir = path.join(process.cwd(), '.workspaces');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Creates a dedicated isolated workspace directory for a repair session.
   */
  createWorkspace(sessionId: string): string {
    // Sanitize session ID to prevent any path injection
    const cleanId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
    const workspacePath = path.join(this.baseDir, `ws_${cleanId}`);

    if (fs.existsSync(workspacePath)) {
      this.destroyWorkspace(workspacePath);
    }
    fs.mkdirSync(workspacePath, { recursive: true });
    return workspacePath;
  }

  /**
   * Safely copies files from source repository to the isolated workspace.
   */
  copyRepository(sourceDir: string, destWorkspace: string): void {
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source repository directory not found: ${sourceDir}`);
    }

    copyDirectoryRecursive(sourceDir, destWorkspace);
  }

  /**
   * Safely writes a file within the workspace, rejecting any path traversal attempts.
   */
  writeFileSafe(workspaceDir: string, relativePath: string, content: string): void {
    // Prevent directory traversal
    const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    const resolved = path.resolve(workspaceDir, normalized);

    if (!resolved.startsWith(path.resolve(workspaceDir))) {
      throw new Error(`Security Exception: Path traversal attempt detected for path: ${relativePath}`);
    }

    const parentDir = path.dirname(resolved);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(resolved, content, 'utf8');
  }

  /**
   * Reads a file safely within the workspace.
   */
  readFileSafe(workspaceDir: string, relativePath: string): string {
    const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    const resolved = path.resolve(workspaceDir, normalized);

    if (!resolved.startsWith(path.resolve(workspaceDir))) {
      throw new Error(`Security Exception: Path traversal attempt detected for path: ${relativePath}`);
    }

    if (!fs.existsSync(resolved)) {
      throw new Error(`File not found: ${relativePath}`);
    }

    return fs.readFileSync(resolved, 'utf8');
  }

  /**
   * Destroys an isolated workspace directory and all contained files.
   */
  destroyWorkspace(workspacePath: string): void {
    try {
      if (fs.existsSync(workspacePath) && workspacePath.includes('.workspaces')) {
        fs.rmSync(workspacePath, { recursive: true, force: true, maxRetries: 3 });
      }
    } catch {
      // Ignore Windows file locking retries
    }
  }
}

function copyDirectoryRecursive(src: string, dest: string): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', '.next', '.workspaces'].includes(entry.name)) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export const workspaceManager = new WorkspaceManager();
