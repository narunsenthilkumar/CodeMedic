import { describe, it, expect } from 'vitest';
import { redactSecrets } from '@/lib/logger';

describe('Security Redaction Engine', () => {
  it('masks OpenAI secret keys as sk-proj-********', () => {
    const raw = 'const key = "sk-1234567890abcdef1234567890abcdef";';
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('1234567890abcdef1234567890abcdef');
    expect(redacted).toContain('sk-proj-********');
  });

  it('masks GitHub personal access tokens as ghp_********', () => {
    const raw = 'Authorization: token ghp_1234567890abcdef1234567890abcdef123456';
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('ghp_1234567890abcdef');
    expect(redacted).toContain('ghp_********');
  });

  it('masks password and token assignments as [REDACTED]', () => {
    const raw = 'api_secret: "my_ultra_secret_production_key_123"';
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('my_ultra_secret_production_key_123');
    expect(redacted).toContain('[REDACTED]');
  });
});
