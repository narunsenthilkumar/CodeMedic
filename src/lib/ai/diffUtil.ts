import * as Diff from 'diff';

/**
 * Creates a clean standard unified diff representation between oldContent and newContent.
 */
export function createUnifiedDiff(
  filePath: string,
  oldContent: string,
  newContent: string
): string {
  const patch = Diff.createTwoFilesPatch(
    `a/${filePath}`,
    `b/${filePath}`,
    oldContent,
    newContent,
    '',
    ''
  );

  return patch.trim();
}

export interface DiffLine {
  type: 'add' | 'delete' | 'normal' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * Parses unified diff string into displayable line objects for the UI DiffViewer.
 */
export function parseDiffLines(unifiedDiff: string): DiffLine[] {
  const lines = unifiedDiff.split('\n');
  const result: DiffLine[] = [];

  let oldLine = 1;
  let newLine = 1;

  for (const line of lines) {
    if (line.startsWith('---') || line.startsWith('+++')) {
      result.push({ type: 'header', content: line });
    } else if (line.startsWith('@@')) {
      result.push({ type: 'header', content: line });
      // Extract line numbers from @@ -1,5 +1,6 @@
      const match = line.match(/@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
    } else if (line.startsWith('+')) {
      result.push({
        type: 'add',
        content: line.substring(1),
        newLineNumber: newLine++,
      });
    } else if (line.startsWith('-')) {
      result.push({
        type: 'delete',
        content: line.substring(1),
        oldLineNumber: oldLine++,
      });
    } else {
      result.push({
        type: 'normal',
        content: line.startsWith(' ') ? line.substring(1) : line,
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
      });
    }
  }

  return result;
}
