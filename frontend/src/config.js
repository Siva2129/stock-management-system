// API base URL — points to the Express backend
// The Vite dev server proxies /api/* to http://localhost:5000
export const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';
