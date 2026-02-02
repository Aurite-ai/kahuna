/**
 * Frontend configuration.
 * Values are loaded from Vite environment variables.
 */
export const config = {
  /** Base URL for the API server */
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
};
