// Controlled Issue 1: Missing dependency 'axios'
// axios is imported here, but never declared in package.json dependencies
import axios from 'axios';

export async function fetchHealthStatus(url: string) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('API request failed', error);
    throw error;
  }
}
