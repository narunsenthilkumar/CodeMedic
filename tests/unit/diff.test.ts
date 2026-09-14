import { describe, it, expect } from 'vitest';
import { createUnifiedDiff, parseDiffLines } from '@/lib/ai/diffUtil';

describe('Unified Diff Engine', () => {
  it('generates a standard unified diff with additions and deletions', () => {
    const oldContent = 'const a = 1;\nconst b = 2;\n';
    const newContent = 'const a = 1;\nconst b = 3;\nconst c = 4;\n';

    const diff = createUnifiedDiff('src/math.ts', oldContent, newContent);
    expect(diff).toContain('--- a/src/math.ts');
    expect(diff).toContain('+++ b/src/math.ts');
    expect(diff).toContain('-const b = 2;');
    expect(diff).toContain('+const b = 3;');
    expect(diff).toContain('+const c = 4;');
  });

  it('correctly parses diff lines into structured line objects for the UI', () => {
    const oldContent = 'first line\n';
    const newContent = 'first line\nsecond line\n';

    const diff = createUnifiedDiff('test.txt', oldContent, newContent);
    const parsed = parseDiffLines(diff);

    const additions = parsed.filter((l) => l.type === 'add');
    expect(additions.length).toBe(1);
    expect(additions[0].content).toContain('second line');
  });
});
