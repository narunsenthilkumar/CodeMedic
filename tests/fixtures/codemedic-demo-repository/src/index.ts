// Controlled Issue 2: Incorrect import (exports computeSum, imports calculateTotal)
import { calculateTotal } from './utils/calculate';
import { fetchData } from './services/api';
import { defaultUser } from './models/user';

// Controlled Issue 4: Missing environment configuration
if (!process.env.DEMO_API_URL) {
  console.error('Missing required environment variable: DEMO_API_URL');
}

export function run() {
  console.log('User:', defaultUser);
}
