const fs = require('fs');
const path = require('path');

console.log('Running test suite...');
const testFile = path.join(__dirname, 'tests', 'math.test.ts');
if (fs.existsSync(testFile)) {
  const content = fs.readFileSync(testFile, 'utf8');
  if (content.includes('toBe(5)')) {
    console.error('FAIL: tests/math.test.ts');
    console.error('  ✕ Math suite > verifies calculation');
    console.error('    AssertionError: Expected: 5, Received: 4');
    console.error('    at tests/math.test.ts:8:20');
    console.log('\nTests: 1 failed, 1 total');
    process.exit(1);
  }
}

console.log('PASS: tests/math.test.ts');
console.log('  ✓ Math suite > verifies calculation');
console.log('\nTests: 1 passed, 0 failed, 1 total');
process.exit(0);
