// Controlled Issue 1: Missing dependency
import axios from 'axios';

export async function fetchData(endpoint: string) {
  const response = await axios.get(endpoint);
  return response.data;
}
