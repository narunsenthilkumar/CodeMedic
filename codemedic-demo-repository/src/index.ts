// Controlled Issue 2: Incorrect import symbol
// math.ts exports 'calcScore', but this file imports 'calculateScore'
import { calculateScore } from './utils/math';

// Controlled Issue 4: Missing environment variable / .env.example
const apiEndpoint = process.env.API_ENDPOINT || 'http://localhost:3000';
const apiSecret = process.env.API_SECRET;

console.log('Starting CodeMedic Demo Server at:', apiEndpoint);

export function main() {
  const score = calculateScore([10, 20, 30]);
  return score;
}
