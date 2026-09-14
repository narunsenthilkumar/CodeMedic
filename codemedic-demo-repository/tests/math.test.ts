// Controlled Issue 5: Failing test assertion
import { add } from '../src/utils/math';

describe('Math Utilities', () => {
  it('adds two numbers correctly', () => {
    // Deliberate test failure for hackathon demo
    expect(add(1, 2)).toBe(4); // deliberate test failure
  });
});
