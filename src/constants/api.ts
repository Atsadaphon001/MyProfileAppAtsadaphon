const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://119.59.102.161:3101/api";

export const API_BASE_URL = `${API_URL}/products`;
export const API_AUTH_URL = API_URL;
