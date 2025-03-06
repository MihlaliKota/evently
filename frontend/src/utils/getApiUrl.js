export function getApiUrl() {
  // Use environment variable for flexibility
  return import.meta.env.VITE_API_URL ||
    'https://evently-production-cd21.up.railway.app';
}