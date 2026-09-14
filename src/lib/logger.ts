// CodeMedic Structured Logger with Automatic Secret Scrubbing

export type LogCategory = 'SCAN' | 'AI' | 'PATCH' | 'VERIFY' | 'SANDBOX' | 'SYSTEM';

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{20,}/g,
  /ghp_[a-zA-Z0-9]{30,}/g,
  /github_pat_[a-zA-Z0-9_-]{20,}/g,
  /xox[baprs]-[0-9a-zA-Z]{10,}/g,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWTs
  /(?:password|passwd|secret|api_key|token)\s*[:=]\s*['"][^'"]+['"]/gi
];

export function redactSecrets(text: string): string {
  if (!text) return text;
  let sanitized = text;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      if (match.startsWith('sk-')) return 'sk-proj-********';
      if (match.startsWith('ghp_')) return 'ghp_********';
      return '[REDACTED]';
    });
  }
  return sanitized;
}

export class Logger {
  private sessionId?: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId;
  }

  private format(category: LogCategory, message: string): string {
    const timestamp = new Date().toISOString().substring(11, 19);
    const sessionTag = this.sessionId ? `[${this.sessionId.slice(-6)}]` : '';
    const cleanMessage = redactSecrets(message);
    return `[${timestamp}] [${category}] ${sessionTag} ${cleanMessage}`;
  }

  scan(message: string): void {
    console.log(this.format('SCAN', message));
  }

  ai(message: string): void {
    console.log(this.format('AI', message));
  }

  patch(message: string): void {
    console.log(this.format('PATCH', message));
  }

  verify(message: string): void {
    console.log(this.format('VERIFY', message));
  }

  sandbox(message: string): void {
    console.log(this.format('SANDBOX', message));
  }

  system(message: string): void {
    console.log(this.format('SYSTEM', message));
  }
}

export const logger = new Logger();
