// Controlled Issue 5: Failing test
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (actual: any) => { toBe: (expected: any) => void };

describe('Math suite', () => {
  it('verifies calculation', () => {
    // Intentional failure: Expected: 5, Received: 4
    expect(2 + 2).toBe(5);
  });
});
