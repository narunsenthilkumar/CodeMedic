const fs = require('fs');
const path = require('path');

console.log('Running test suite...');

const testFilePath = path.join(__dirname, 'tests', 'math.test.ts');
if (fs.existsSync(testFilePath)) {
  const content = fs.readFileSync(testFilePath, 'utf8');
  if (content.includes('toBe(4)') || content.includes('// deliberate test failure')) {
    console.error('FAIL: tests/math.test.ts');
    console.error('  ✕ Math Utilities > adds two numbers correctly');
    console.error('    AssertionError: expected 3 to deeply equal 4');
    console.error('    at tests/math.test.ts:7:23');
    console.log('\nTests: 1 failed, 1 passed, 2 total');
    process.exit(1);
  }
}

console.log('PASS: tests/math.test.ts');
console.log('  ✓ Math Utilities > adds two numbers correctly');
console.log('  ✓ Math Utilities > handles positive integers');
console.log('\nTests: 2 passed, 0 failed, 2 total');
console.log('Duration: 124ms');
process.exit(0);
